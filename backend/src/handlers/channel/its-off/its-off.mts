import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { getChannel } from '/opt/nodejs/dynamo.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Handler for a user declaring that it is off
 */
const itsOff = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
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
    logger.error('Error getting private channel: ', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (privateChannel == null) {
    // Only the user that owns a channel can say it's on
    logger.warn('User does not own channel')
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
          'SET #canceled = :canceled, #lastUpdated = :lastUpdated',
        ExpressionAttributeNames: {
          '#canceled': 'canceled',
          '#lastUpdated': 'lastUpdated',
        },
        ExpressionAttributeValues: {
          ':canceled': true,
          ':lastUpdated': requestTime,
        },
      }),
    )
    logger.debug('Success - item updated', { ddbResponse })
    return createResponse({
      eventPath,
      responseBody: { message: "It's Off" },
      statusCode: 200,
    })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}

export default itsOff
