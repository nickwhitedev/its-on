import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { createResponse } from '../utils/response'

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
  console.debug('received:', event)

  const eventPath = event.path
  const channelID = event.pathParameters?.channelID

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

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
    console.info('Success - item deleted', ddbResponse)
    return createResponse({
      eventPath,
      responseBody: { message: 'Deleted' },
      statusCode: 204,
    })
  } catch (err) {
    // TODO: Error handling - make more robust
    console.error('Error', err instanceof Error ? err.stack : 'Unknown Type')
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}
