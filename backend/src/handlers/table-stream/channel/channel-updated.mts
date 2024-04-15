import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME, WEB_URL } from '/opt/nodejs/constants.mjs'
import { batchWrite } from '/opt/nodejs/dynamo.mjs'
import { MS_IN_HOUR } from '/opt/nodejs/time.mjs'
import {
  getMessagingChannelTopic,
  initializeFirebase,
} from '/opt/nodejs/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
  metrics: Metrics
}

export const handleChannelUpdated = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const [pk, sk] = [
    record.dynamodb?.Keys?.pk?.S ?? '',
    record.dynamodb?.Keys?.sk?.S ?? '',
  ]

  const channelOwnerID = pk.substring(pk.indexOf('#') + 1)
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
          pk: `channel#${channelID}`,
          sk: 'info',
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
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)

  // Send notifications if it's on
  if (
    !channelInfo.canceled &&
    (channelInfo.lastOn ?? 0) >
      (oldChannelInfo.lastOn ?? 0) + (oldChannelInfo.lastOnDuration ?? 0)
  ) {
    try {
      await initializeFirebase()
    } catch (error) {
      logger.error('Failed to initialize Firebase', error as Error)
    }

    try {
      const topic = getMessagingChannelTopic({ channelID, channelOwnerID })
      const messageID = await getMessaging().send({
        apns: {
          headers: {
            'apns-expiration': `${Math.floor(
              (Date.now() + (channelInfo.duration ?? MS_IN_HOUR * 12)) / 1000,
            )}`,
          },
        },
        data: {
          url: `${WEB_URL}/${channelID}`,
        },
        notification: {
          title: `${channelInfo.title ?? 'Untitled Channel'} • ${
            channelInfo.owner ?? 'unknown'
          }`,
          body: channelInfo.note ?? '',
        },
        topic,
        webpush: {
          fcmOptions: {
            link: `${WEB_URL}/${channelID}`,
          },
          headers: {
            ttl: `${channelInfo.duration ?? (MS_IN_HOUR * 12) / 1000}`,
          },
        },
      })
      logger.debug('Message sent to notification topic', { topic, messageID })
    } catch (error) {
      logger.error('Error sending notifications', error as Error)
    }
  }
  logger.debug('Finished updating items successfully')
}
