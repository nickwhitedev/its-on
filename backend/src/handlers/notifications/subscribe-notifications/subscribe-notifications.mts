import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PushSubscription } from 'web-push'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  subscription: PushSubscription
}

/**
 * Adds a user's notification subscription to their profile in Dynamo DB
 */
const subscribeNotifications = async (
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
        message:
          'Request body must contain subscription as an instance of PushSubscription',
      },
      statusCode: 400,
    })
  }

  const subscription = (JSON.parse(event.body) as IPayload).subscription

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: 'notificationSubscriptions',
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'SET #subscriptions.#subscriptionID = :subscription',
        ExpressionAttributeNames: {
          '#subscriptions': 'subscriptions',
          '#subscriptionID': subscription.endpoint,
        },
        ExpressionAttributeValues: {
          ':subscription': JSON.stringify(subscription),
        },
      }),
    )
    logger.debug('Success - user profile updated', { ddbResponse })
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'ValidationException' &&
      error.message ===
        'The document path provided in the update expression is invalid for update'
    ) {
      // If one of the attributes has not yet been created,
      //   create them as empty maps...
      const ddbEmptyMapResponse = await ddbDocClient.send(
        new UpdateCommand({
          Key: {
            pk: `user#${userID}`,
            sk: 'notificationSubscriptions',
          },
          ReturnValues: 'ALL_NEW',
          TableName: DYNAMODB_TABLE_NAME,
          UpdateExpression: 'SET #subscriptions = :emptyMap',
          ExpressionAttributeNames: {
            '#subscriptions': 'subscriptions',
          },
          ExpressionAttributeValues: {
            ':emptyMap': {},
          },
        }),
      )
      logger.debug('Success - empty map added', {
        ddbResponse: ddbEmptyMapResponse,
      })

      // ...then retry the updates
      const ddbResponse = await ddbDocClient.send(
        new UpdateCommand({
          Key: {
            pk: `user#${userID}`,
            sk: 'notificationSubscriptions',
          },
          ReturnValues: 'ALL_NEW',
          TableName: DYNAMODB_TABLE_NAME,
          UpdateExpression:
            'SET #subscriptions.#subscriptionID = :subscription',
          ExpressionAttributeNames: {
            '#subscriptions': 'subscriptions',
            '#subscriptionID': subscription.endpoint,
          },
          ExpressionAttributeValues: {
            ':subscription': JSON.stringify(subscription),
          },
        }),
      )
      logger.debug('Success - user profile updated', { ddbResponse })
    } else {
      logger.error('Error', error as Error)
      return createResponse({
        eventPath,
        responseBody: { message: 'Something went wrong' },
        statusCode: 400,
      })
    }
  }

  return createResponse({
    eventPath,
    responseBody: { message: 'Notifications enabled for device' },
    statusCode: 200,
  })
}

export default subscribeNotifications
