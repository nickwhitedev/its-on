import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { customAlphabet } from 'nanoid'
import { alphanumeric } from 'nanoid-dictionary'

const nanoid = customAlphabet(alphanumeric, 16)

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  title: string
}

/**
 * Creates a channel for the authenticated user
 */
export const createChannelHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.info('received:', event)

  const { title } = JSON.parse(event.body ?? '') as IPayload
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const username: string =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    event.requestContext.authorizer?.claims['cognito:username'] ?? ''
  const channelID = nanoid()

  const channelAttributes = {
    note: '',
    on: false,
    owner: username,
    title,
  }
  let statusCode: number
  let responseBody: IChannel | IResponseWithMessage

  try {
    const ddbResponse = await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE_NAME]: [
            {
              PutRequest: {
                Item: {
                  pk: `user#${userID}`,
                  sk: `channel#${channelID}`,
                  ...channelAttributes,
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  pk: `channel#${channelID}`,
                  sk: 'info',
                  note: '',
                  on: false,
                  owner: username,
                  title,
                },
              },
            },
          ],
        },
      }),
    )
    statusCode = 201
    responseBody = {
      id: channelID,
      ...channelAttributes,
    }
    console.info('Success - item added or updated', ddbResponse)
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
