import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { MS_IN_HOUR } from '../utils/time'
import { createResponse } from '../utils/response'
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
  console.debug('received:', event)

  const eventPath = event.path

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  const channelID = event.pathParameters?.channelID

  if (channelID == null) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Bad Request' },
      statusCode: 400,
    })
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
    capacity = 5, // TODO: Implement dynamic limit
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
          ':capacity': capacity > 5 ? 5 : capacity, // TODO: Implement dynamic limit
          ':duration': duration,
          ':lastUpdated': event.requestContext.requestTimeEpoch,
          ':note': note.substring(0, 200),
          ':title': title.substring(0, 40),
        },
      }),
    )
    console.info('Success - item updated', ddbResponse)
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
