import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.js'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleProfileUpdated = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  if (
    record.dynamodb?.OldImage?.username.S ===
    record.dynamodb?.NewImage?.username.S
  ) {
    return
  }

  const pk = record.dynamodb?.Keys?.pk.S

  // get and update user channels
  let lastEvaluatedKey: Record<string, unknown> | undefined
  let queryBatchCount = 0
  do {
    logger.debug(`Start Query batch ${(++queryBatchCount).toString()}`)

    let channels: IDynamoChannelItem[]

    try {
      const ddbResponse: QueryCommandOutput = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression:
            '#pk = :pkvalue and begins_with(sk, :skprefix)',
          ExpressionAttributeNames: {
            '#pk': 'pk',
          },
          ExpressionAttributeValues: {
            ':pkvalue': pk,
            ':skprefix': 'channel',
          },
          Limit: 100,
          ...(lastEvaluatedKey != null
            ? { ExclusiveStartKey: lastEvaluatedKey }
            : {}),
        }),
      )
      channels = (ddbResponse.Items ?? []) as IDynamoChannelItem[]
      lastEvaluatedKey = ddbResponse.LastEvaluatedKey
      logger.debug('Get user channels', { ddbResponse })
    } catch (error) {
      logger.error('Get user channels error', error as Error)
      channels = []
    }

    // update user channels
    let batchCount = 0
    const channelsToUpdate = [...channels]
    while (channelsToUpdate.length > 0) {
      // Limiting to 50 to stay under transact write limit, which is 100 requests per batch write
      const channelChunk = channelsToUpdate.splice(0, 50)
      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: channelChunk.map(({ sk: channelSK }) => ({
              Update: {
                Key: {
                  pk: pk,
                  sk: channelSK,
                },
                ReturnValues: 'ALL_NEW',
                TableName: DYNAMODB_TABLE_NAME,
                UpdateExpression: 'SET #owner = :owner',
                ExpressionAttributeNames: {
                  '#owner': 'owner',
                },
                ExpressionAttributeValues: {
                  ':owner': record.dynamodb?.NewImage?.username.S,
                },
              },
            })),
          }),
        )
        logger.debug(
          `Successful batch update user channels - batch ${(++batchCount).toString()}`,
        )
      } catch (error) {
        logger.error('batch update user channels failed', error as Error)
      }
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)

  // get and update user subscription edges
  lastEvaluatedKey = undefined
  queryBatchCount = 0
  do {
    logger.debug(`Start Query batch ${(++queryBatchCount).toString()}`)

    let subscriptions: IDynamoChannelItem[]

    try {
      const ddbResponse: QueryCommandOutput = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression:
            '#pk = :pkvalue and begins_with(sk, :skprefix)',
          ExpressionAttributeNames: {
            '#pk': 'pk',
          },
          ExpressionAttributeValues: {
            ':pkvalue': pk,
            ':skprefix': 'subscription',
          },
          Limit: 100,
          ...(lastEvaluatedKey != null
            ? { ExclusiveStartKey: lastEvaluatedKey }
            : {}),
        }),
      )
      subscriptions = (ddbResponse.Items ?? []) as IDynamoChannelItem[]
      lastEvaluatedKey = ddbResponse.LastEvaluatedKey
      logger.debug('Get user subscriptions', { ddbResponse })
    } catch (error) {
      logger.error('Get user subscriptions error', error as Error)
      subscriptions = []
    }

    // update user subscriptions
    let batchCount = 0
    const subscriptionsToUpdate = [...subscriptions]
    while (subscriptionsToUpdate.length > 0) {
      // Limiting to 50 to stay under transact write limit, which is 100 requests per batch write
      const subscriptionChunk = subscriptionsToUpdate.splice(0, 50)
      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: subscriptionChunk.map(
              ({ pk: subscriptionPK, sk: subscriptionSK }) => ({
                Update: {
                  Key: {
                    pk: `channel#${subscriptionSK.substring(
                      subscriptionSK.indexOf('#') + 1,
                    )}`,
                    sk: `subscriber#${subscriptionPK.substring(
                      subscriptionPK.indexOf('#') + 1,
                    )}`,
                  },
                  ReturnValues: 'ALL_NEW',
                  TableName: DYNAMODB_TABLE_NAME,
                  UpdateExpression: 'SET #username = :username',
                  ExpressionAttributeNames: {
                    '#username': 'username',
                  },
                  ExpressionAttributeValues: {
                    ':username': record.dynamodb?.NewImage?.username.S,
                  },
                },
              }),
            ),
          }),
        )
        logger.debug(
          `Successful transact update - batch ${(++batchCount).toString()}`,
        )
      } catch (error) {
        logger.error('batch update user channels failed', error as Error)
      }
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)
  logger.debug('Finished updating items successfully')
}
