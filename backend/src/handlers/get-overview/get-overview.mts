import { Logger } from '@aws-lambda-powertools/logger'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'
import { serializeQueryResponse } from '/opt/nodejs/serialize.mjs'
import { MS_IN_DAY } from '/opt/nodejs/time.mjs'
import {
  getMessagingChannelTopic,
  getUserTopic,
  initializeFirebase,
} from '/opt/nodejs/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get all of a user's data
 *
 * Includes user info, channels, and subscriptions.
 */
const getOverview = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getOverview only accept GET method, you tried: ${event.httpMethod}`,
    )
  }

  try {
    await initializeFirebase()
  } catch (error) {
    logger.error('Failed to initialize Firebase', error as Error)
  }

  const eventPath = event.path
  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  try {
    const ddbResponse = await ddbDocClient.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        KeyConditionExpression: '#pk = :userID',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':userID': `user#${userID}`,
        },
      }),
    )
    logger.debug('Successful user partition query', { ddbResponse })

    const data = serializeQueryResponse(
      ddbResponse.Items ?? [],
    ) as IOverviewResponse

    if (!('profile' in data)) {
      const userAttributes = {
        channelCount: 0,
        eligibleForUpgrade: false,
        lastNewSubscriberNotification: 0,
        notificationsEnabled: true,
        notificationTokens: {},
        subscriptionCount: 0,
        tier: 5,
        upgradeQualifyingEventTimestamps: [],
        username: (event.requestContext.authorizer?.username ?? '') as string,
      }
      // Put a user profile item
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Item: {
              pk: `user#${userID}`,
              sk: 'profile',
              ...userAttributes,
            } as IDynamoUserItem,
          }),
        )
        logger.debug('Successful user profile write')

        data.profile = { id: userID, ...userAttributes }
      } catch (error) {
        logger.error({
          message: 'write user profile failed: ',
          error: error as Error,
        })
        return createResponse({
          eventPath,
          responseBody: { message: 'Something went wrong' },
          statusCode: 400,
        })
      }
    }

    if (data.profile != null && data.profile.notificationTokens == null) {
      // Initialize notificationTokens map if missing
      try {
        const ddbResponse = await ddbDocClient.send(
          new UpdateCommand({
            Key: {
              pk: `user#${userID}`,
              sk: 'profile',
            },
            ReturnValues: 'ALL_NEW',
            TableName: DYNAMODB_TABLE_NAME,
            UpdateExpression: 'SET #notificationTokens = :emptyMap',
            ExpressionAttributeNames: {
              '#notificationTokens': 'notificationTokens',
            },
            ExpressionAttributeValues: {
              ':emptyMap': {},
            },
          }),
        )
        data.profile.notificationTokens = {}
        logger.debug('User notificationTokens field initialized', {
          ddbResponse,
        })
      } catch (error) {
        logger.error(
          'User notificationTokens field initialization failed',
          error as Error,
        )
      }
    }

    if (
      data.profile != null &&
      (data.subscriptions?.length ?? 0) > 0 &&
      data.subscriptions?.length !== data.profile.subscriptionTopics?.size
    ) {
      // Sync subscription topics
      try {
        const subscriptionTopics = new Set(
          (data.subscriptions ?? []).map(subscription =>
            getMessagingChannelTopic({
              channelID: subscription.id,
              channelOwnerID: subscription.ownerID ?? '',
            }),
          ),
        )
        const ddbResponse = await ddbDocClient.send(
          new UpdateCommand({
            Key: {
              pk: `user#${userID}`,
              sk: `profile`,
            },
            ReturnValues: 'ALL_NEW',
            TableName: DYNAMODB_TABLE_NAME,
            UpdateExpression: 'SET #subscriptionTopics = :subscriptionTopics',
            ExpressionAttributeNames: {
              '#subscriptionTopics': 'subscriptionTopics',
            },
            ExpressionAttributeValues: {
              ':subscriptionTopics': subscriptionTopics,
            },
          }),
        )
        data.profile.subscriptionTopics = subscriptionTopics
        logger.debug('Subscription topics synced on user profile', {
          ddbResponse,
        })
      } catch (error) {
        logger.error('Subscription topic sync error', error as Error)
      }

      // Subscribe user to channel notification topics
      try {
        await Promise.all([
          ...Object.keys(data.profile.notificationTokens ?? {}).map(token => [
            getMessaging().subscribeToTopic(token, getUserTopic(userID)),
            ...Array.from(data.profile?.subscriptionTopics ?? new Set([])).map(
              subscriptionTopic =>
                getMessaging().subscribeToTopic(token, subscriptionTopic),
            ),
          ]),
        ])
      } catch (error) {
        logger.error(
          "Failed to subscribe token to user's subscriptions",
          error as Error,
        )
      }
    }

    const expiredTokens = Object.entries(
      data.profile?.notificationTokens ?? {},
    ).filter(([_token, tokenData]) => tokenData.lastUpdated < MS_IN_DAY - 30)

    if (data.profile != null && expiredTokens.length > 0) {
      // Prune expired tokens
      try {
        await Promise.all([
          ...expiredTokens.map(([token, _tokenData]) => [
            getMessaging().unsubscribeFromTopic(token, getUserTopic(userID)),
            ...Array.from(data.profile?.subscriptionTopics ?? new Set([])).map(
              subscriptionTopic =>
                getMessaging().unsubscribeFromTopic(token, subscriptionTopic),
            ),
          ]),
        ])

        const ddbResponse = await ddbDocClient.send(
          new UpdateCommand({
            Key: {
              pk: `user#${userID}`,
              sk: 'profile',
            },
            ReturnValues: 'ALL_NEW',
            TableName: DYNAMODB_TABLE_NAME,
            UpdateExpression: `REMOVE ${expiredTokens.map(([token, _tokenData]) => `notificationTokens.${token}`).join(', ')}`,
          }),
        )
        data.profile.notificationTokens = Object.fromEntries(
          Object.entries(data.profile.notificationTokens ?? {}).filter(
            ([_token, tokenData]) => tokenData.lastUpdated >= MS_IN_DAY - 30,
          ),
        )
        logger.debug('Stale tokens deleted', { ddbResponse })
      } catch (error) {
        logger.error('Stale token deletion failed', error as Error)
      }
    }

    logger.info('Overview fetched', { userID })

    return createResponse({
      eventPath,
      responseBody: data,
      statusCode: 200,
    })
  } catch (error) {
    logger.error({ message: 'DynamoDB Query Error: ', error: error as Error })
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}

export default getOverview
