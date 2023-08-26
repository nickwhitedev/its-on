import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

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

  const { compositeID, defaultNote, id, note, on, title } = JSON.parse(
    event.body ?? '',
  ) as IChannel

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  const params = {
    RequestItems: {
      [DYNAMODB_TABLE_NAME]: [
        {
          PutRequest: {
            Item: {
              pk: `user#${userID}`,
              sk: `channel#${id}`,
              compositeID,
              defaultNote,
              note,
              on,
              title,
            },
          },
        },
        {
          PutRequest: {
            Item: {
              pk: `channel#${compositeID}`,
              sk: 'info',
              note,
              on,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              owner:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                event.requestContext.authorizer?.claims['cognito:username'] ??
                '',
              title,
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
    responseBody = {
      compositeID,
      defaultNote,
      id,
      note,
      on,
      title,
    }
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
