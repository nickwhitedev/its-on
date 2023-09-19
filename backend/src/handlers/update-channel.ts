import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getChannel } from '../utils/dynamo'

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  const channelID = event.pathParameters?.channelID

  if (channelID == null) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Bad Request' }),
    }
  }

  let channelIsNotOwnedByUser: boolean
  try {
    channelIsNotOwnedByUser =
      (await getChannel({ channelID, ddbDocClient, userID })) == null
  } catch (error) {
    console.error(
      'Error',
      error instanceof Error ? error.stack : 'Unknown Type',
    )
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Something went wrong' }),
    }
  }
  if (channelIsNotOwnedByUser) {
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'You may only update a channel you own',
      }),
    }
  }

  const { note, on, title } = JSON.parse(event.body ?? '') as IChannel

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${channelID}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'SET #note = :note, #on = :on, #title = :title',
        ExpressionAttributeNames: {
          '#note': 'note',
          '#on': 'on',
          '#title': 'title',
        },
        ExpressionAttributeValues: {
          ':note': note.substring(0, 200),
          ':on': on,
          ':title': title.substring(0, 40),
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
