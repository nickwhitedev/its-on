import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME, ENV } from '/opt/nodejs/constants.mjs'
import { getChannel } from '/opt/nodejs/dynamo.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'
import { MS_IN_HOUR } from '/opt/nodejs/time.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Handler for a user declaring that it is on
 */
export const itsOnHandler = async (
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
  const channelID = event.pathParameters?.channelID ?? ''

  let privateChannel: IDynamoChannelItem | undefined
  // get private channel entry
  try {
    privateChannel = await getChannel({ channelID, ddbDocClient, userID })
  } catch (error) {
    console.error('Error getting private channel: ', error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (privateChannel == null) {
    // Only the user that owns a channel can say it's on
    if (ENV !== 'prod') {
      console.debug('User does not own channel')
    }
    return createResponse({
      eventPath,
      responseBody: {
        message: 'You do not own this channel',
      },
      statusCode: 403,
    })
  }

  const requestTime = event.requestContext.requestTimeEpoch
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
          'SET #canceled = :canceled, #lastOn = :lastOn, #lastOnDuration = :lastOnDuration, #lastUpdated = :lastUpdated',
        ExpressionAttributeNames: {
          '#canceled': 'canceled',
          '#lastOn': 'lastOn',
          '#lastOnDuration': 'lastOnDuration',
          '#lastUpdated': 'lastUpdated',
        },
        ExpressionAttributeValues: {
          ':canceled': false,
          ':lastOn': requestTime,
          ':lastOnDuration': privateChannel.duration ?? MS_IN_HOUR,
          ':lastUpdated': requestTime,
        },
      }),
    )
    if (ENV !== 'prod') {
      console.debug('Success - item updated', ddbResponse)
    }
    return createResponse({
      eventPath,
      responseBody: { message: "It's On!" },
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
