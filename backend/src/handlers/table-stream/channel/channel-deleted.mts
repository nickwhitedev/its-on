import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { nanoid } from 'nanoid'
import { DYNAMODB_TABLE_NAME } from 'opt/nodejs/common/constants.mjs'
import { batchWrite, getUserInfo } from 'opt/nodejs/common/dynamo.mjs'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleChannelDeleted = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const channelPK = record.dynamodb?.Keys?.pk.S ?? ''
  const channelSK = record.dynamodb?.Keys?.sk.S ?? ''

  const ownerID = channelPK.substring(channelPK.indexOf('#') + 1)
  const channelID = channelSK.substring(channelSK.indexOf('#') + 1)

  // Reduce channel owner's channel count (if user still exists)
  if ((await getUserInfo({ ddbDocClient, userID: ownerID })) != null) {
    try {
      const ddbResponse = await ddbDocClient.send(
        new UpdateCommand({
          Key: {
            pk: `user#${ownerID}`,
            sk: `profile`,
          },
          ReturnValues: 'ALL_NEW',
          TableName: DYNAMODB_TABLE_NAME,
          UpdateExpression: 'ADD #channelCount :channelCount',
          ExpressionAttributeNames: {
            '#channelCount': 'channelCount',
          },
          ExpressionAttributeValues: {
            ':channelCount': -1,
          },
        }),
      )
      logger.debug('Success - channel count updated', { ddbResponse })
    } catch (error) {
      logger.error('Channel count decrement error', error as Error)
    }
  }

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
    logger.debug('Successful public channel delete')
  } catch (error) {
    logger.error('public channel delete failed', error as Error)
  }

  let lastEvaluatedKey: Record<string, unknown> | undefined
  do {
    let subscribers: IDynamoChannelSubscriber[] | null

    try {
      const ddbResponse: QueryCommandOutput = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression:
            'pk = :pkvalue and begins_with(sk, :skprefix)',
          ExpressionAttributeValues: {
            ':pkvalue': `channel#${channelID}`,
            ':skprefix': 'subscriber',
          },
        }),
      )
      subscribers = ddbResponse.Items as IDynamoChannelSubscriber[] | null
      lastEvaluatedKey = ddbResponse.LastEvaluatedKey
      logger.debug('Get channel subscribers', { ddbResponse })
    } catch (error) {
      logger.error('Get public channel error', error as Error)
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
                  // Delete pk=channel sk=subscriber copy
                  {
                    DeleteRequest: {
                      Key: {
                        pk,
                        sk,
                      },
                    },
                  },
                  // Delete pk=user sk=subscription copy
                  {
                    DeleteRequest: {
                      Key: {
                        pk: `user#${sk.substring(sk.indexOf('#') + 1)}`,
                        sk: `subscription#${pk.substring(pk.indexOf('#') + 1)}`,
                      },
                    },
                  },
                  // Create 'Removed' placeholder pk=user sk=subscription copy
                  {
                    PutRequest: {
                      Item: {
                        deleted: true,
                        duration: 0,
                        note: '',
                        lastOn: 0,
                        owner: '',
                        pk: `user#${sk.substring(sk.indexOf('#') + 1)}`,
                        sk: `subscription#${nanoid()}`,
                        title: 'Removed',
                      } as IDynamoChannelItem,
                    },
                  },
                ]
              }),
            },
          },
          ddbDocClient,
        })
        logger.debug(
          `Successful batch write/delete - batch ${(++batchCount).toString()}`,
        )
      } catch (error) {
        logger.error('batch write/delete failed', error as Error)
      }
      logger.debug(`Batches of items written/deleted: ${batchCount.toString()}`)
      // Next batch in the queue
      subscribers.splice(0, 12)
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)
}
