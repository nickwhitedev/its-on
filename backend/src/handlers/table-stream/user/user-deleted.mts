import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { getUserTopic, initializeFirebase } from '/opt/nodejs/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleUserDeleted = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const pk = record.dynamodb?.Keys?.pk?.S

  // get and delete user channels
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

    // Delete user channels
    let batchCount = 0
    const channelsToUpdate = [...channels]
    while (channelsToUpdate.length > 0) {
      // Limiting to 50 to stay under transact write limit, which is 100 requests per batch write
      const channelChunk = channelsToUpdate.splice(0, 50)
      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: channelChunk.map(({ sk: channelSK }) => ({
              Delete: {
                Key: {
                  pk: pk,
                  sk: channelSK,
                },
                TableName: DYNAMODB_TABLE_NAME,
              },
            })),
          }),
        )
        logger.debug(
          `Successful batch delete user channels - batch ${(++batchCount).toString()}`,
        )
      } catch (error) {
        logger.error('batch delete user channels failed', error as Error)
      }
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)

  // get and delete user subscription edges
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

    // delete user subscriptions (channel -> subscriber copy)
    let subscriberBatchCount = 0
    const subscribersToUpdate = [...subscriptions]
    while (subscribersToUpdate.length > 0) {
      // Limiting to 50 to stay under transact write limit, which is 100 requests per batch write
      const subscriptionChunk = subscribersToUpdate.splice(0, 50)
      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: subscriptionChunk.map(
              ({ pk: subscriptionPK, sk: subscriptionSK }) => ({
                Delete: {
                  Key: {
                    pk: `channel#${subscriptionSK.substring(
                      subscriptionSK.indexOf('#') + 1,
                    )}`,
                    sk: `subscriber#${subscriptionPK.substring(
                      subscriptionPK.indexOf('#') + 1,
                    )}`,
                  },
                  TableName: DYNAMODB_TABLE_NAME,
                },
              }),
            ),
          }),
        )
        logger.debug(
          `Successful transact delete - batch ${(++subscriberBatchCount).toString()}`,
        )
      } catch (error) {
        logger.error('batch delete user channels failed', error as Error)
      }
    }

    // delete user subscriptions
    let subscriptionBatchCount = 0
    const subscriptionsToUpdate = [...subscriptions]
    while (subscriptionsToUpdate.length > 0) {
      // Limiting to 50 to stay under transact write limit, which is 100 requests per batch write
      const subscriptionChunk = subscriptionsToUpdate.splice(0, 50)
      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: subscriptionChunk.map(
              ({ pk: subscriptionPK, sk: subscriptionSK }) => ({
                Delete: {
                  Key: {
                    pk: subscriptionPK,
                    sk: subscriptionSK,
                  },
                  TableName: DYNAMODB_TABLE_NAME,
                },
              }),
            ),
          }),
        )
        logger.debug(
          `Successful transact delete - batch ${(++subscriptionBatchCount).toString()}`,
        )
      } catch (error) {
        logger.error('batch delete user channels failed', error as Error)
      }
    }
  } while (lastEvaluatedKey != null && Object.keys(lastEvaluatedKey).length > 0)

  // Unsubscribe from all subscription topics and user topic for all tokens
  try {
    const userID = pk?.substring(pk.indexOf('#') + 1) ?? ''
    await initializeFirebase()
    await Promise.all([
      ...Object.keys(
        record.dynamodb?.OldImage?.notificationTokens?.M ?? {},
      ).map(token => [
        getMessaging().unsubscribeFromTopic(token, getUserTopic(userID)),
        ...Array.from(
          record.dynamodb?.OldImage?.subscriptionTopics?.SS ?? new Set([]),
        ).map(subscriptionTopic =>
          getMessaging().unsubscribeFromTopic(token, subscriptionTopic),
        ),
      ]),
    ])
  } catch (error) {
    logger.error(
      "Failed to unsubscribe token to user's subscriptions",
      error as Error,
    )
  }

  logger.debug('Finished deleting items successfully')
}
