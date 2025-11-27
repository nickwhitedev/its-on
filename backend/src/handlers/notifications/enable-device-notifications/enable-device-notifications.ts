import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.js'
import { createResponse } from '../../../common/response.js'
import { getUserInfo } from '../../../common/dynamo.js'
import { getUserTopic, initializeFirebase } from '../../../common/firebase.js'
import { getMessaging } from 'firebase-admin/messaging'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  token: string
}

/**
 * Adds a user's notification subscription to their profile in Dynamo DB
 */
const enableDeviceNotifications = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path

  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  if (event.body == null) {
    return createResponse({
      eventPath,
      responseBody: {
        message: 'Request body must contain token: string',
      },
      statusCode: 400,
    })
  }

  const token = (JSON.parse(event.body) as IPayload).token

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: 'profile',
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'SET #notificationTokens.#token = :tokenData',
        ExpressionAttributeNames: {
          '#notificationTokens': 'notificationTokens',
          '#token': token,
        },
        ExpressionAttributeValues: {
          ':tokenData': { lastUpdated: Date.now() },
        },
      }),
    )
    logger.debug('Success - user profile updated', { ddbResponse })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  const userInfo = await getUserInfo({ ddbDocClient, userID })
  if (userInfo?.notificationsEnabled ?? true) {
    // Subscribe to all subscription topics and user topic with the new token
    try {
      await initializeFirebase()
      await Promise.all([
        getMessaging().subscribeToTopic(token, getUserTopic(userID)),
        ...Array.from(userInfo?.subscriptionTopics ?? new Set([])).map(
          subscriptionTopic =>
            getMessaging().subscribeToTopic(token, subscriptionTopic),
        ),
      ])
    } catch (error) {
      logger.error(
        "Failed to subscribe token to user's subscriptions",
        error as Error,
      )
    }
  }

  return createResponse({
    eventPath,
    responseBody: { message: 'Notifications enabled for device' },
    statusCode: 200,
  })
}

export default enableDeviceNotifications
