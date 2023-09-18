import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { customAlphabet } from 'nanoid'
import { alphanumeric } from 'nanoid-dictionary'
import { getChannel } from '../utils/dynamo'

const nanoid = customAlphabet(alphanumeric, 11)

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const username: string =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    event.requestContext.authorizer?.claims['cognito:username'] ?? ''
  let channelID = nanoid()
  let channelIDIsTaken: boolean
  let channelIDAttempt = 1

  do {
    try {
      channelIDIsTaken = (await getChannel({ channelID, ddbDocClient })) != null
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
    if (channelIDIsTaken) {
      console.info(`Collision detected. Generating id #${++channelIDAttempt}`)
      channelID = nanoid()
    }
  } while (channelIDIsTaken)

  const channelAttributes = {
    note: '',
    on: false,
    owner: username,
    title: (JSON.parse(event.body ?? '') as IPayload).title.substring(0, 40),
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
                  ...channelAttributes,
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
      subscribers: [],
      ...channelAttributes,
    }
    console.info('Success - item added or updated', ddbResponse)
  } catch (error) {
    statusCode = 400
    console.error(
      'Error',
      error instanceof Error ? error.stack : 'Unknown Type',
    )
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
