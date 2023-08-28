import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Updates a channel for the authenticated user
 */
export const updateChannelHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'PUT') {
    throw new Error(
      `putMethod only accepts PUT method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.info('received:', event)

  const { id, note, on } = JSON.parse(event.body ?? '') as IChannel

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${id}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'SET #note = :note, #on = :on',
        ExpressionAttributeNames: {
          '#note': 'note',
          '#on': 'on',
        },
        ExpressionAttributeValues: {
          ':note': note,
          ':on': on,
        },
      }),
    )
    statusCode = 200
    responseBody = { message: 'Updated' }
    console.info('Success - item updated', ddbResponse)
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
