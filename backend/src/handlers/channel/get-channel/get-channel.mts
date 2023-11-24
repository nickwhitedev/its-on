import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import * as dynamo from '/opt/nodejs/dynamo.mjs'
import { ChannelCopyTypeEnum } from '/opt/nodejs/enums.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'
import { serializeQueryResponse } from '/opt/nodejs/serialize.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get info for a channel
 */
const getChannel = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accept GET method, you tried: ${event.httpMethod}`,
    )
  }

  const eventPath = event.path

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''
  const channelID = event.pathParameters?.channelID

  if (channelID == null) {
    logger.error('No channelID given')
    return createResponse({
      eventPath,
      responseBody: { message: 'Channel ID must be given' },
      statusCode: 400,
    })
  }

  // get owner channel copy
  let privateChannel: IDynamoChannelItem | undefined
  try {
    privateChannel = await dynamo.getChannel({
      channelID,
      ddbDocClient,
      userID,
    })
  } catch (error) {
    logger.error('Private channel get error: ', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (privateChannel != null) {
    const { pk: _pk, sk: _sk, ...channelInfo } = privateChannel

    // query channel partition for subscribers
    let subscribers: IChannelSubscriber[]
    try {
      const ddbResponse = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression:
            '#pk = :pkvalue and begins_with(sk, :skprefix)',
          ExpressionAttributeNames: {
            '#pk': 'pk',
          },
          ExpressionAttributeValues: {
            ':pkvalue': `channel#${channelID}`,
            ':skprefix': 'subscriber',
          },
        }),
      )
      subscribers = (
        serializeQueryResponse(ddbResponse.Items ?? []) as {
          subscribers: IChannelSubscriber[]
        }
      ).subscribers
      logger.debug('Success - channel owner data: ', { ddbResponse })
    } catch (error) {
      logger.error('Dynamo Query Error', error as Error)
      return createResponse({
        eventPath,
        responseBody: { message: 'Something went wrong' },
        statusCode: 400,
      })
    }

    return createResponse({
      eventPath,
      statusCode: 200,
      responseBody: {
        id: channelID,
        ...channelInfo,
        subscribers,
      } as IChannel,
    })
  }

  // get subscriber channel copy
  let subscriberChannel: IDynamoChannelItem | undefined
  try {
    subscriberChannel = await dynamo.getChannel({
      channelID,
      ddbDocClient,
      userID,
      copyType: ChannelCopyTypeEnum.SUBSCRIBER,
    })
  } catch (error) {
    logger.error('Subscriber channel get error: ', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (subscriberChannel != null) {
    const { pk: _pk, sk: _sk, ...channelInfo } = subscriberChannel

    return createResponse({
      eventPath,
      statusCode: 200,
      responseBody: {
        id: channelID,
        subscribers: [],
        ...channelInfo,
      } as IChannel,
    })
  }

  // User doesn't own channel
  // get public channel info
  let publicChannel: IDynamoChannelItem | undefined
  try {
    publicChannel = await dynamo.getChannel({ channelID, ddbDocClient })
  } catch (error) {
    logger.error('Dynamo Get Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (publicChannel == null) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Channel not found' },
      statusCode: 404,
    })
  }

  const { pk, sk: _sk, ...channelInfo } = publicChannel

  return createResponse({
    eventPath,
    responseBody: {
      id: pk.substring(pk.indexOf('#') + 1),
      subscribers: [],
      ...channelInfo,
    } as IChannel,
    statusCode: 200,
  })
}

export default getChannel
