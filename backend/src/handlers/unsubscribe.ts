import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Unsubscribes the authenticated user to a channel
 */
export const unsubscribeHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.info('received:', event)

  const channelID = event.pathParameters?.channelID ?? '' // is composite id
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  const params = {
    RequestItems: {
      [DYNAMODB_TABLE_NAME]: [
        {
          DeleteRequest: {
            Key: {
              pk: `user#${userID}`,
              sk: `subscription#${channelID}`,
            },
          },
        },
        {
          DeleteRequest: {
            Key: {
              pk: `channel#${channelID}`,
              sk: `subscriber#${userID}`,
            },
          },
        },
      ],
    },
  }

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(new BatchWriteCommand(params))
    statusCode = 200
    responseBody = { message: 'Unsubscribed' }
    console.info('Success - items added or updated', ddbResponse)
  } catch (err) {
    statusCode = 400
    console.error('Error', err instanceof Error ? err.stack : 'Unknown Type')
    responseBody = { message: 'Something went wrong' }
  }

  const response = {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  }

  console.info(`response from: ${event.path}: `, {
    statusCode: response.statusCode,
    body: responseBody,
  })

  return response
}
