import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'

import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { alphanumeric } from 'nanoid-dictionary'
import { createResponse } from '../utils/response'
import { customAlphabet } from 'nanoid'
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
  const eventPath = event.path

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
      return createResponse({
        eventPath,
        responseBody: { message: 'Something went wrong' },
        statusCode: 400,
      })
    }
    if (channelIDIsTaken) {
      console.info(`Collision detected. Generating id #${++channelIDAttempt}`)
      channelID = nanoid()
    }
  } while (channelIDIsTaken)

  const channelAttributes = {
    owner: username,
    title: (JSON.parse(event.body ?? '') as IPayload).title.substring(0, 40),
  }

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
                  note: '',
                  on: false,
                  ...channelAttributes,
                } as IDynamoChannelItem,
              },
            },
            {
              PutRequest: {
                Item: {
                  pk: `channel#${channelID}`,
                  sk: 'info',
                  ...channelAttributes,
                } as IDynamoPublicChannelItem,
              },
            },
          ],
        },
      }),
    )
    console.info('Success - item added or updated', ddbResponse)
    return createResponse({
      eventPath,
      responseBody: {
        id: channelID,
        subscribers: [],
        note: '',
        on: false,
        ...channelAttributes,
      },
      statusCode: 201,
    })
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
}
