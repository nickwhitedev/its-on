import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { batchWrite } from '../utils/dynamo'
import { MS_IN_HOUR } from '../utils/time'

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
    pk,
    sk,
    title: record.dynamodb?.NewImage?.title?.S ?? '',
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

    let subscribers: IDynamoChannelSubscriber[] | null

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
          ...(lastEvaluatedKey != null
            ? { ExclusiveStartKey: lastEvaluatedKey }
            : {}),
        }),
      )
      subscribers = ddbResponse.Items as IDynamoChannelSubscriber[] | null
      lastEvaluatedKey = ddbResponse.LastEvaluatedKey
      console.info('Get public channel and subscribers: ', ddbResponse)
    } catch (err) {
      console.error('Get public channel error', err)
      return
    }

    // bulk write all channel copies
    let batchCount = 0
    while (subscribers != null && subscribers.length > 0) {
      // Limiting to 12 to stay under batch write limit, which is 25 requests per batch write
      const subscriberChunk = subscribers.slice(0, 12)
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
      console.info(`Batches of items updated: ${batchCount}`)
      // Next batch in the queue
      subscribers.splice(0, 12)
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)
  console.info('Finished updating items successfully')

  // TODO: send notifications if it's on
}
