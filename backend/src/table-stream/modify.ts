import {
  BatchGetCommand,
  BatchGetCommandOutput,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnits, Metrics } from '@aws-lambda-powertools/metrics'
import { KeysAndAttributes } from '@aws-sdk/client-dynamodb'
import { DynamoDBRecord } from 'aws-lambda'
import { PushSubscription, sendNotification } from 'web-push'
import {
  DYNAMODB_TABLE_NAME,
  PUSH_NOTIFICATION_PRIVATE_KEY,
  PUSH_NOTIFICATION_PUBLIC_KEY,
  WEB_URL,
} from '../common/constants'
import { batchWrite } from '../common/dynamo'
import { MS_IN_HOUR } from '../common/time'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
  metrics: Metrics
}

const sendUserNotification = async ({
  channelID,
  channelNote,
  channelOwner,
  channelTitle,
  notificationSubscription,
  TTL,
  logger,
}: {
  channelID: string
  channelNote: string
  channelOwner: string
  channelTitle: string
  notificationSubscription: string
  TTL: number
  logger: Logger
}) => {
  const pushSubscription = JSON.parse(
    notificationSubscription,
  ) as PushSubscription
  try {
    await sendNotification(
      pushSubscription,
      JSON.stringify({
        title: `${channelTitle} • ${channelOwner}`,
        options: {
          body: channelNote,
          data: {
            url: `${WEB_URL}/${channelID}`,
          },
        },
      }),
      {
        TTL,
        vapidDetails: {
          subject: 'mailto:contact@itson.fyi',
          privateKey: PUSH_NOTIFICATION_PRIVATE_KEY,
          publicKey: PUSH_NOTIFICATION_PUBLIC_KEY,
        },
      },
    )
  } catch (error) {
    // TODO: Log error
    logger.error('Notification Send Error: ', error as Error)
  }
}

const sendUserNotifications = async ({
  channelID,
  channelNote,
  channelOwner,
  channelTitle,
  notificationSubscriptions,
  TTL,
  logger,
}: {
  channelID: string
  channelNote: string
  channelOwner: string
  channelTitle: string
  notificationSubscriptions: IDynamoUserNotificationSubscriptionsItem
  TTL: number
  logger: Logger
}) => {
  await Promise.all(
    Object.values(notificationSubscriptions.subscriptions).map(
      async notificationSubscription => {
        await sendUserNotification({
          channelID,
          channelNote,
          channelOwner,
          channelTitle,
          notificationSubscription,
          TTL,
          logger,
        })
      },
    ),
  )
}

export const handleModifyEvent = async ({
  record,
  ddbDocClient,
  logger,
  metrics,
}: Params) => {
  const [pk, sk] = [
    record.dynamodb?.Keys?.pk?.S ?? '',
    record.dynamodb?.Keys?.sk?.S ?? '',
  ]
  if (!pk.startsWith('user') || !sk.startsWith('channel')) {
    return
  }

  const channelID = sk.substring(sk.indexOf('#') + 1)

  const channelInfo: IDynamoChannelItem = {
    canceled: record.dynamodb?.NewImage?.canceled?.BOOL ?? false,
    capacity: parseInt(record.dynamodb?.NewImage?.capacity?.N ?? '5'),
    duration: parseInt(
      record.dynamodb?.NewImage?.duration?.N ?? MS_IN_HOUR.toString(),
    ),
    lastOn: parseInt(record.dynamodb?.NewImage?.lastOn?.N ?? '0'),
    lastOnDuration: parseInt(
      record.dynamodb?.NewImage?.lastOnDuration?.N ?? MS_IN_HOUR.toString(),
    ),
    lastUpdated: parseInt(record.dynamodb?.NewImage?.lastUpdated?.N ?? '0'),
    note: record.dynamodb?.NewImage?.note?.S ?? '',
    owner: record.dynamodb?.NewImage?.owner?.S ?? '',
    ownerID: record.dynamodb?.NewImage?.ownerID?.S ?? '',
    pk,
    sk,
    subscriberCount: parseInt(
      record.dynamodb?.NewImage?.subscriberCount?.N ?? '0',
    ),
    title: record.dynamodb?.NewImage?.title?.S ?? '',
  }

  const oldChannelInfo: IDynamoChannelItem = {
    canceled: record.dynamodb?.OldImage?.canceled?.BOOL ?? false,
    capacity: parseInt(record.dynamodb?.OldImage?.capacity?.N ?? '5'),
    duration: parseInt(
      record.dynamodb?.OldImage?.duration?.N ?? MS_IN_HOUR.toString(),
    ),
    lastOn: parseInt(record.dynamodb?.OldImage?.lastOn?.N ?? '0'),
    lastOnDuration: parseInt(
      record.dynamodb?.OldImage?.lastOnDuration?.N ?? MS_IN_HOUR.toString(),
    ),
    lastUpdated: parseInt(record.dynamodb?.OldImage?.lastUpdated?.N ?? '0'),
    note: record.dynamodb?.OldImage?.note?.S ?? '',
    owner: record.dynamodb?.OldImage?.owner?.S ?? '',
    ownerID: record.dynamodb?.OldImage?.ownerID?.S ?? '',
    pk,
    sk,
    subscriberCount: parseInt(
      record.dynamodb?.OldImage?.subscriberCount?.N ?? '0',
    ),
    title: record.dynamodb?.OldImage?.title?.S ?? '',
  }

  // Put a public channel
  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
          ...channelInfo,
          canceled: false,
          pk: `channel#${channelID}`,
          sk: 'info',
          duration: 0,
          lastOn: 0,
          lastOnDuration: 0,
          note: '',
        } as IDynamoChannelItem,
      }),
    )
    logger.debug('Successful public channel write')
  } catch (error) {
    logger.error('write public channel failed', error as Error)
    return
  }

  let lastEvaluatedKey: Record<string, unknown> | undefined
  let queryBatchCount = 0
  do {
    logger.debug(`Start Query batch ${++queryBatchCount}`)

    let subscribers: IDynamoChannelSubscriber[]

    try {
      const ddbResponse = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression:
            '#pk = :pkvalue and begins_with(sk, :skprefix)',
          ExpressionAttributeNames: {
            '#pk': 'pk',
          },
          ExpressionAttributeValues: {
            ':pkvalue': `channel#${channelID}`,
            ':skprefix': 'subscriber',
          },
          Limit: 100,
          ...(lastEvaluatedKey != null
            ? { ExclusiveStartKey: lastEvaluatedKey }
            : {}),
        }),
      )
      subscribers = (ddbResponse.Items ?? []) as IDynamoChannelSubscriber[]
      lastEvaluatedKey = ddbResponse.LastEvaluatedKey
      logger.debug('Get public channel subscribers', { ddbResponse })
    } catch (error) {
      logger.error('Get public channel subscribers error', error as Error)
      return
    }

    // bulk write all channel copies
    let batchCount = 0
    const subscribersToUpdate = [...subscribers]
    while (subscribersToUpdate.length > 0) {
      // Limiting to 12 to stay under batch write limit, which is 25 requests per batch write
      const subscriberChunk = subscribersToUpdate.splice(0, 12)
      try {
        await batchWrite({
          batchWriteInput: {
            RequestItems: {
              [DYNAMODB_TABLE_NAME]: subscriberChunk.map(
                ({ pk: subscriberPK, sk: subscriberSK }) => {
                  return {
                    PutRequest: {
                      Item: {
                        ...channelInfo,
                        pk: `user#${subscriberSK.substring(
                          subscriberSK.indexOf('#') + 1,
                        )}`,
                        sk: `subscription#${subscriberPK.substring(
                          subscriberPK.indexOf('#') + 1,
                        )}`,
                      } as IDynamoChannelItem,
                    },
                  }
                },
              ),
            },
          },
          ddbDocClient,
        })
        logger.debug(`Successful batch write - batch ${++batchCount}`)
      } catch (error) {
        logger.error('batch write failed', error as Error)
        return
      }
    }

    // Send notifications if it's on
    if (
      !channelInfo.canceled &&
      (channelInfo.lastOn ?? 0) >
        (oldChannelInfo.lastOn ?? 0) + (oldChannelInfo.lastOnDuration ?? 0)
    ) {
      let unprocessedKeys:
        | Record<
            string,
            Omit<KeysAndAttributes, 'Keys'> & {
              Keys: Record<string, unknown>[] | undefined
            }
          >
        | undefined = {
        [DYNAMODB_TABLE_NAME]: {
          Keys: subscribers.map(({ sk: subscriberSK }) => ({
            pk: `user#${subscriberSK.substring(subscriberSK.indexOf('#') + 1)}`,
            sk: 'notificationSubscriptions',
          })),
        },
      }
      let getBatchCount = 0
      do {
        logger.debug(`Start Get batch ${++getBatchCount}`)

        let subscriberNotificationSubscriptions: IDynamoUserNotificationSubscriptionsItem[]

        try {
          const ddbResponse: BatchGetCommandOutput = await ddbDocClient.send(
            new BatchGetCommand({
              RequestItems: unprocessedKeys,
            }),
          )
          subscriberNotificationSubscriptions = (ddbResponse.Responses?.[
            DYNAMODB_TABLE_NAME
          ] ?? []) as IDynamoUserNotificationSubscriptionsItem[]
          unprocessedKeys = ddbResponse.UnprocessedKeys
          logger.debug('Get subscriber notification subscriptions', {
            subscriptions: subscriberNotificationSubscriptions,
          })
        } catch (error) {
          logger.error('Get public channel subscribers error', error as Error)
          return
        }

        try {
          await Promise.all(
            subscriberNotificationSubscriptions.map(
              async notificationSubscriptions => {
                await sendUserNotifications({
                  channelID,
                  channelNote: channelInfo.note ?? '',
                  channelOwner: channelInfo.owner ?? 'unknown',
                  channelTitle: channelInfo.title ?? 'Untitled Channel',
                  notificationSubscriptions,
                  TTL: (channelInfo.lastOnDuration ?? MS_IN_HOUR) * 1000,
                  logger,
                })
              },
            ),
          )
          metrics.addMetric(
            'notificationSent',
            MetricUnits.Count,
            subscriberNotificationSubscriptions.length,
          )
        } catch (error) {
          logger.error('Notification Send Error', error as Error)
        }
      } while ((unprocessedKeys?.[DYNAMODB_TABLE_NAME]?.Keys ?? []).length > 0)
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)
  logger.debug('Finished updating items successfully')
}
