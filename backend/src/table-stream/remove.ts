import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb'

import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME, ENV } from '../common/constants'
import { batchWrite } from '../common/dynamo'

export const handleRemoveEvent = async (
  record: DynamoDBRecord,
  ddbDocClient: DynamoDBDocumentClient,
) => {
  if (
    !record.dynamodb?.Keys?.pk?.S?.startsWith('user') ||
    !record.dynamodb.Keys.sk.S?.startsWith('channel')
  ) {
    return
  }

  const channelID = record.dynamodb.Keys.sk.S.substring(
    record.dynamodb.Keys.sk.S.indexOf('#') + 1,
  )

  // Delete the public channel
  try {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          pk: `channel#${channelID}`,
          sk: 'info',
        },
      }),
    )
    if (ENV !== 'prod') {
      console.debug('Successful public channel delete')
    }
  } catch (error) {
    console.error('public channel delete failed: ', error)
  }

  let lastEvaluatedKey: Record<string, unknown> | undefined
  do {
    let subscribers: IDynamoChannelSubscriber[] | null

    try {
      const ddbResponse: QueryCommandOutput = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression: 'pk = :pkval',
          ExpressionAttributeValues: { ':pkval': `channel#${channelID}` },
          ...(lastEvaluatedKey != null
            ? { ExclusiveStartKey: lastEvaluatedKey }
            : {}),
        }),
      )
      subscribers = ddbResponse.Items as IDynamoChannelSubscriber[] | null
      lastEvaluatedKey = ddbResponse.LastEvaluatedKey
      if (ENV !== 'prod') {
        console.debug('Get channel subscribers: ', ddbResponse)
      }
    } catch (error) {
      console.error('Get public channel error', error)
      return
    }

    // bulk delete all channel copies and mark subscriber copies as deleted
    let batchCount = 0
    while (subscribers != null && subscribers.length > 0) {
      // Limiting to 12 to stay under batch write limit, which is 25 requests per batch write
      const subscriberChunk = subscribers.slice(0, 12)
      try {
        await batchWrite({
          batchWriteInput: {
            RequestItems: {
              [DYNAMODB_TABLE_NAME]: subscriberChunk.flatMap(({ pk, sk }) => {
                return [
                  {
                    DeleteRequest: {
                      Key: {
                        pk,
                        sk,
                      },
                    },
                  },
                  {
                    PutRequest: {
                      Item: {
                        deleted: true,
                        duration: 0,
                        note: '',
                        lastOn: 0,
                        owner: record.dynamodb?.OldImage?.owner?.S ?? '',
                        pk: `user#${sk.substring(sk.indexOf('#') + 1)}`,
                        sk: `subscription#${pk.substring(pk.indexOf('#') + 1)}`,
                        title: record.dynamodb?.OldImage?.title?.S ?? '',
                      } as IDynamoChannelItem,
                    },
                  },
                ]
              }),
            },
          },
          ddbDocClient,
        })
        if (ENV !== 'prod') {
          console.debug(`Successful batch write/delete - batch ${++batchCount}`)
        }
      } catch (error) {
        console.error('batch write/delete failed: ', error)
      }
      if (ENV !== 'prod') {
        console.debug(`Batches of items written/deleted: ${batchCount}`)
      }
      // Next batch in the queue
      subscribers.splice(0, 12)
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)
}
