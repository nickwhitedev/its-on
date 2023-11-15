import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getChannel, getUserInfo } from '/opt/nodejs/dynamo'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME, ENV } from '/opt/nodejs/constants'
import { createResponse } from '/opt/nodejs/response'
import { MS_IN_HOUR } from '/opt/nodejs/time'

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
  if (ENV !== 'prod') {
    console.debug('received:', event)
  }

  const eventPath = event.path

  const channelID = event.pathParameters?.channelID

  if (channelID == null) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Bad Request' },
      statusCode: 400,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''
  let userInfo
  try {
    userInfo = await getUserInfo({ ddbDocClient, userID })
  } catch (error) {
    console.error(
      'Get User Info Error',
      error instanceof Error ? error.stack : 'Unknown Type',
    )
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
  const userTier = userInfo?.tier ?? 5

  let channelIsNotOwnedByUser: boolean
  try {
    channelIsNotOwnedByUser =
      (await getChannel({ channelID, ddbDocClient, userID })) == null
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
  if (channelIsNotOwnedByUser) {
    return createResponse({
      eventPath,
      responseBody: {
        message: 'You may only update a channel you own',
      },
      statusCode: 403,
    })
  }

  const {
    capacity = userTier,
    duration = MS_IN_HOUR,
    note = '',
    title = '',
  } = JSON.parse(event.body ?? '{}') as IChannel

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${channelID}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression:
          'SET #capacity = :capacity, #duration = :duration, #lastUpdated = :lastUpdated, #note = :note, #title = :title',
        ExpressionAttributeNames: {
          '#capacity': 'capacity',
          '#duration': 'duration',
          '#lastUpdated': 'lastUpdated',
          '#note': 'note',
          '#title': 'title',
        },
        ExpressionAttributeValues: {
          ':capacity': capacity > userTier ? userTier : Math.floor(capacity),
          ':duration': duration,
          ':lastUpdated': event.requestContext.requestTimeEpoch,
          ':note': note.substring(0, 200),
          ':title': title.substring(0, 40),
        },
      }),
    )
    if (ENV !== 'prod') {
      console.debug('Success - item updated', ddbResponse)
    }
    return createResponse({
      eventPath,
      responseBody: { message: 'Updated' },
      statusCode: 200,
    })
  } catch (error) {
    // TODO: Error handling - make more robust
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
