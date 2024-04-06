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

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  token?: string
  userID?: string
}

/**
 * Removes a user's notification subscription from their profile in Dynamo DB
 */
const unsubscribeNotifications = async (
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
  const userID = requestBody.userID
  const token = requestBody.token

  if ([undefined, ''].includes(userID) || token == null) {
    return createParams400Response(eventPath)
  }

  try {
    logger.debug('token: ', token)
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: 'notificationSubscriptions',
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'DELETE #tokens :token',
        ExpressionAttributeNames: {
          '#tokens': 'tokens',
        },
        ExpressionAttributeValues: {
          ':token': new Set([token]),
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

export default unsubscribeNotifications
