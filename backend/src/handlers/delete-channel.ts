import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Deletes a channel for the authenticated user
 */
export const deleteChannelHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'DELETE') {
    throw new Error(
      `Delete method only accepts DELETE method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.info('received:', event)

  const channelID = event.pathParameters?.channelID

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(
      new DeleteCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${channelID}`,
        },
        TableName: DYNAMODB_TABLE_NAME,
      }),
    )
    statusCode = 204
    responseBody = { message: 'Deleted' }
    console.info('Success - item deleted', ddbResponse)
  } catch (err) {
    // TODO: Error handling - make more robust
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
