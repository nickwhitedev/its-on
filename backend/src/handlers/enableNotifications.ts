import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { createResponse } from '../utils/response'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  notificationSubscription: string
}

/**
 * Adds a user's notification subscription to their profile in Dynamo DB
 */
export const enableNotificationsHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.debug('received:', event)

  const eventPath = event.path

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  if (event.body == null) {
    return createResponse({
      eventPath,
      responseBody: {
        message:
          'Request body must contain notificationSubscription as an instance of PushSubscription',
      },
      statusCode: 400,
    })
  }

  const notificationSubscription = JSON.parse(
    (JSON.parse(event.body) as IPayload).notificationSubscription,
  ) as PushSubscription

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `profile`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression:
          'SET #notificationSubscription.#notificationSubscriptionID = :notificationSubscription',
        ExpressionAttributeNames: {
          '#notificationSubscription': 'notificationSubscription',
          '#notificationSubscriptionID': notificationSubscription.endpoint,
        },
        ExpressionAttributeValues: {
          ':notificationSubscription': JSON.stringify(notificationSubscription),
        },
      }),
    )
    console.info('Success - user profile updated', ddbResponse)
  } catch (error) {
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

  return createResponse({
    eventPath,
    responseBody: { message: 'Notifications Enabled' },
    statusCode: 200,
  })
}
