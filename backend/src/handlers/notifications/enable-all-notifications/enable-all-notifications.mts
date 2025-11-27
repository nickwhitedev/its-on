import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'
import { getUserTopic, initializeFirebase } from '/opt/nodejs/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'
import { getUserInfo } from '/opt/nodejs/dynamo.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Enables notifications for a user
 */
const enableAllNotifications = async (
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

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `profile`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'SET #notificationsEnabled = :notificationsEnabled',
        ExpressionAttributeNames: {
          '#notificationsEnabled': 'notificationsEnabled',
        },
        ExpressionAttributeValues: {
          ':notificationsEnabled': true,
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

  // Subscribe to all subscription topics and user topic with all tokens
  try {
    await initializeFirebase()
    const userInfo = await getUserInfo({ ddbDocClient, userID })
    await Promise.all([
      ...Object.keys(userInfo?.notificationTokens ?? {}).flatMap(token => [
        getMessaging().subscribeToTopic(token, getUserTopic(userID)),
        ...Array.from(userInfo?.subscriptionTopics ?? new Set([])).map(
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

  return createResponse({
    eventPath,
    responseBody: { message: 'Notifications enabled' },
    statusCode: 200,
  })
}

export default enableAllNotifications
