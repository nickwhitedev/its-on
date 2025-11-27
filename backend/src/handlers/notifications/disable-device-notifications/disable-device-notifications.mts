import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.mjs'
import { createResponse } from '../../../common/response.mjs'
import { getUserTopic, initializeFirebase } from '../../../common/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'
import { getUserInfo } from '../../../common/dynamo.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  token?: string
  userID?: string
}

/**
 * Removes a user's notification subscription from their profile in Dynamo DB
 */
const disableDeviceNotifications = async (
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

  if (event.body == null) {
    return createParams400Response(eventPath)
  }

  const requestBody = JSON.parse(event.body) as IPayload
  const userID = requestBody.userID ?? ''
  const token = requestBody.token
  const userInfo = await getUserInfo({ ddbDocClient, userID })

  if ([undefined, ''].includes(userID) || token == null) {
    return createParams400Response(eventPath)
  }

  try {
    logger.debug('token: ', token)
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: 'profile',
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'REMOVE #notificationTokens.#token',
        ExpressionAttributeNames: {
          '#notificationTokens': 'notificationTokens',
          '#token': token,
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

  // Unsubscribe from all subscription topics and user topic for token
  try {
    await initializeFirebase()
    await Promise.all([
      getMessaging().unsubscribeFromTopic(token, getUserTopic(userID)),
      ...Array.from(userInfo?.subscriptionTopics ?? new Set([])).map(
        subscriptionTopic =>
          getMessaging().unsubscribeFromTopic(token, subscriptionTopic),
      ),
    ])
  } catch (error) {
    logger.error(
      "Failed to unsubscribe token to user's subscriptions",
      error as Error,
    )
  }

  return createResponse({
    eventPath,
    responseBody: { message: 'Notifications disabled for device' },
    statusCode: 200,
  })
}

const createParams400Response = (eventPath: string) =>
  createResponse({
    eventPath,
    responseBody: {
      message:
        'Request body must contain userID and subscription as an instance of PushSubscription',
    },
    statusCode: 400,
  })

export default disableDeviceNotifications
