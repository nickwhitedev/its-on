import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getChannel, getUserInfo } from '/opt/nodejs/dynamo.js'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { customAlphabet } from 'nanoid'
import { alphanumeric } from 'nanoid-dictionary'
import { DYNAMODB_TABLE_NAME, ENV } from '/opt/nodejs/constants.js'
import { createResponse } from '/opt/nodejs/response.js'
import { MS_IN_HOUR } from '/opt/nodejs/time.js'

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
  if (ENV !== 'prod') {
    console.debug('received:', event)
  }
  const eventPath = event.path

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  const userInfo = await getUserInfo({ ddbDocClient, userID })
  const userTier = userInfo?.tier ?? 5
  const username = userInfo?.username ?? ''

  if ((userInfo?.channelCount ?? 0) >= userTier) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Upgrade to create more channels' },
      statusCode: 403,
    })
  }

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
      console.warn(`Collision detected. Generating id #${++channelIDAttempt}`)
      channelID = nanoid()
    }
  } while (channelIDIsTaken)

  const channelAttributes: Partial<IDynamoChannelItem> = {
    capacity: userTier,
    duration: MS_IN_HOUR,
    lastOn: 0,
    lastOnDuration: MS_IN_HOUR,
    lastUpdated: event.requestContext.requestTimeEpoch,
    note: '',
    owner: username,
    ownerID: userID,
    subscriberCount: 0,
    title: (JSON.parse(event.body ?? '{}') as IPayload).title.substring(0, 40),
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
                  lastUpdated: 0,
                } as IDynamoChannelItem,
              },
            },
          ],
        },
      }),
    )
    if (ENV !== 'prod') {
      console.debug('Success - item added or updated', ddbResponse)
    }
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

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `profile`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'ADD #channelCount :channelCount',
        ExpressionAttributeNames: {
          '#channelCount': 'channelCount',
        },
        ExpressionAttributeValues: {
          ':channelCount': 1,
        },
      }),
    )
    if (ENV !== 'prod') {
      console.debug('Success - channel count updated', ddbResponse)
    }
  } catch (error) {
    console.error(
      'Update Error',
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
    responseBody: {
      id: channelID,
      subscribers: [],
      ...channelAttributes,
    } as IChannel,
    statusCode: 201,
  })
}
