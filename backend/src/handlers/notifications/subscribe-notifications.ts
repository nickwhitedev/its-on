import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PushSubscription } from 'web-push'
import { DYNAMODB_TABLE_NAME, ENV } from '/opt/nodejs/constants'
import { createResponse } from '/opt/nodejs/response'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  subscription: PushSubscription
}

/**
 * Adds a user's notification subscription to their profile in Dynamo DB
 */
export const subscribeNotificationsHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  if (ENV !== 'prod') {
    console.debug('received:', event)
  }

  const eventPath = event.path

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

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
    if (ENV !== 'prod') {
      console.debug('Success - user profile updated', ddbResponse)
    }
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
      if (ENV !== 'prod') {
        console.debug('Success - empty map added', ddbEmptyMapResponse)
      }

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
      if (ENV !== 'prod') {
        console.debug('Success - user profile updated', ddbResponse)
      }
    } else {
      console.error(
        'Error',
        error instanceof Error ? error.stack : 'Unknown Type',
      )
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
