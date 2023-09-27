import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { getChannel } from '../utils/dynamo'
import { createResponse } from '../utils/response'

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
  console.debug('received:', event)

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
    console.info('User does not own channel')
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
        UpdateExpression: 'SET #lastOn = :lastOn, #lastUpdated = :lastUpdated',
        ExpressionAttributeNames: {
          '#lastOn': 'lastOn',
          '#lastUpdated': 'lastUpdated',
        },
        ExpressionAttributeValues: {
          ':lastOn': requestTime,
          ':lastUpdated': requestTime,
        },
      }),
    )
    console.info('Success - item updated', ddbResponse)
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
