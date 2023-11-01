import {
  BatchGetCommand,
  BatchGetCommandOutput,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { KeysAndAttributes } from '@aws-sdk/client-dynamodb'
import { DynamoDBRecord } from 'aws-lambda'
import { PushSubscription, sendNotification } from 'web-push'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { batchWrite } from '../utils/dynamo'
import { MS_IN_HOUR } from '../utils/time'

const sendUserNotification = async ({
  channelOwner,
  channelTitle,
  notificationSubscription,
  TTL,
}: {
  channelOwner: string
  channelTitle: string
  notificationSubscription: {
    S: string
  }
  TTL: number
}) => {
  const pushSubscription = JSON.parse(
    notificationSubscription.S,
  ) as PushSubscription
  try {
    await sendNotification(
      pushSubscription,
      `${channelTitle} by ${channelOwner} is on!`,
      {
        TTL,
      },
    )
  } catch (error) {
    // TODO: Log error
    console.error('Notification Send Error: ', error)
  }
}

const sendUserNotifications = async ({
  channelOwner,
  channelTitle,
  notificationSubscriptions,
  TTL,
}: {
  channelOwner: string
  channelTitle: string
  notificationSubscriptions: IDynamoStreamUserNotificationSubscriptionsImage
  TTL: number
}) => {
  console.debug(
    'sendUserNotifications: notificationSubscriptions',
    notificationSubscriptions,
  )
  console.debug(
    'sendUserNotifications: notificationSubscriptions.subscriptions: ',
    notificationSubscriptions.subscriptions,
  )
  console.debug(
    'sendUserNotifications: notificationSubscriptions.subscriptions.M: ',
    notificationSubscriptions.subscriptions.M,
  )
  await Promise.all(
    Object.values(notificationSubscriptions.subscriptions.M).map(
      async notificationSubscription => {
        await sendUserNotification({
          channelOwner,
          channelTitle,
          notificationSubscription,
          TTL,
        })
      },
    ),
  )
}

export const handleModifyEvent = async (
  record: DynamoDBRecord,
  ddbDocClient: DynamoDBDocumentClient,
) => {
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
    console.info('Successful public channel write')
  } catch (error) {
    console.error('write public channel failed: ', error)
    return
  }

  let lastEvaluatedKey: Record<string, unknown> | undefined
  let queryBatchCount = 0
  do {
    console.info(`Start Query batch ${++queryBatchCount}`)

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
      console.info('Get public channel subscribers: ', ddbResponse)
    } catch (err) {
      console.error('Get public channel subscribers error', err)
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
        console.info(`Successful batch write - batch ${++batchCount}`)
      } catch (error) {
        console.error('batch write failed: ', error)
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
        console.info(`Start Get batch ${++getBatchCount}`)

        let subscriberNotificationSubscriptions: IDynamoStreamUserNotificationSubscriptionsImage[]

        try {
          const ddbResponse: BatchGetCommandOutput = await ddbDocClient.send(
            new BatchGetCommand({
              RequestItems: unprocessedKeys,
            }),
          )
          subscriberNotificationSubscriptions = (ddbResponse.Responses?.[
            DYNAMODB_TABLE_NAME
          ] ?? []) as IDynamoStreamUserNotificationSubscriptionsImage[]
          unprocessedKeys = ddbResponse.UnprocessedKeys
          console.info(
            'Get subscriber notification subscriptions: ',
            subscriberNotificationSubscriptions,
          )
        } catch (err) {
          console.error('Get public channel subscribers error', err)
          return
        }

        try {
          await Promise.all(
            subscriberNotificationSubscriptions.map(
              async notificationSubscriptions => {
                await sendUserNotifications({
                  channelOwner: channelInfo.owner ?? 'unknown',
                  channelTitle: channelInfo.title ?? 'Untitled Channel',
                  notificationSubscriptions,
                  TTL: (channelInfo.lastOnDuration ?? MS_IN_HOUR) * 1000,
                })
              },
            ),
          )
        } catch (error) {
          console.error('Notification Send Error: ', error)
        }
      } while ((unprocessedKeys?.[DYNAMODB_TABLE_NAME]?.Keys ?? []).length > 0)
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)
  console.info('Finished updating items successfully')
}
