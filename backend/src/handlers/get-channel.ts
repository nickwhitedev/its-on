import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { ChannelCopyTypeEnum } from '../utils/enums'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { createResponse } from '../utils/response'
import { getChannel } from '../utils/dynamo'
import { serializeQueryResponse } from '../utils/serialize'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get info for a channel
 */
export const getChannelHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.debug('received:', event)

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
    console.error('No channelID given')
    return createResponse({
      eventPath,
      responseBody: { message: 'Channel ID must be given' },
      statusCode: 400,
    })
  }

  // get owner channel copy
  let privateChannel: IDynamoChannelItem | undefined
  try {
    privateChannel = await getChannel({ channelID, ddbDocClient, userID })
  } catch (error) {
    console.error('Private channel get error: ', error)
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
      console.info('Success - channel owner data: ', ddbResponse)
    } catch (error) {
      console.error('Dynamo Query Error', error)
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
      },
    })
  }

  // get subscriber channel copy
  let subscriberChannel: IDynamoChannelItem | undefined
  try {
    subscriberChannel = await getChannel({
      channelID,
      ddbDocClient,
      userID,
      copyType: ChannelCopyTypeEnum.SUBSCRIBER,
    })
  } catch (error) {
    console.error('Subscriber channel get error: ', error)
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
      },
    })
  }

  // User doesn't own channel
  // get public channel info
  let publicChannel: IDynamoChannelItem | undefined
  try {
    publicChannel = await getChannel({ channelID, ddbDocClient })
  } catch (error) {
    console.error('Dynamo Get Error', error)
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
