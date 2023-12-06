import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnits, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { getChannel, getUserInfo } from '/opt/nodejs/dynamo.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Subscribes the authenticated user to a channel
 */
const subscribe = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
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
    logger.error('Get User Info Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if ((userInfo?.subscriptionCount ?? 0) >= (userInfo?.tier ?? 5)) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Upgrade to subscribe to more channels' },
      statusCode: 403,
    })
  }

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

  if (privateChannel != null) {
    // Subscriptions should only be for public copies of channels
    logger.warn('User owns channel')
    return createResponse({
      eventPath,
      responseBody: {
        message: 'You cannot subscribe to a channel you own',
      },
      statusCode: 403,
    })
  }

  // get public channel info
  let channelAttributes
  try {
    const publicChannel = await getChannel({ channelID, ddbDocClient })
    if (publicChannel == null) {
      return createResponse({
        eventPath,
        responseBody: { message: 'Not found' },
        statusCode: 404,
      })
    }
    const { pk: _pk, sk: _sk, ...channelInfo } = publicChannel
    channelAttributes = channelInfo
    logger.debug('Get public channel info: ', { channel: publicChannel })
  } catch (error) {
    logger.error('Get public channel error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (
    (channelAttributes.subscriberCount ?? 0) >=
    (channelAttributes.capacity ?? 5)
  ) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Channel is full' },
      statusCode: 403,
    })
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
                  sk: `subscription#${channelID}`,
                  ...channelAttributes,
                } as IDynamoChannelItem,
              },
            },
            {
              PutRequest: {
                Item: {
                  pk: `channel#${channelID}`,
                  sk: `subscriber#${userID}`,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  username:
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    event.requestContext.authorizer?.claims['cognito:username'],
                } as IDynamoChannelSubscriber,
              },
            },
          ],
        },
      }),
    )
    logger.debug('Success - items added or updated', { ddbResponse })
  } catch (error) {
    logger.error('Batch Write Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  updateSubscriberCount: try {
    if (channelAttributes.ownerID == null) break updateSubscriberCount
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${channelAttributes.ownerID}`,
          sk: `channel#${channelID}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'ADD #subscriberCount :subscriberCount',
        ExpressionAttributeNames: {
          '#subscriberCount': 'subscriberCount',
        },
        ExpressionAttributeValues: {
          ':subscriberCount': 1,
        },
      }),
    )
    logger.debug('Success - subscriber count updated', { ddbResponse })
  } catch (error) {
    logger.error('Update Error', error as Error)
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
        UpdateExpression: 'ADD #subscriptionCount :subscriptionCount',
        ExpressionAttributeNames: {
          '#subscriptionCount': 'subscriptionCount',
        },
        ExpressionAttributeValues: {
          ':subscriptionCount': 1,
        },
      }),
    )
    logger.debug('Success - subscription count updated', { ddbResponse })
  } catch (error) {
    logger.error('Update Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  metrics.addMetric('subscribeToChannel', MetricUnits.Count, 1)

  return createResponse({
    eventPath,
    responseBody: {
      channel: {
        id: channelID,
        subscribers: [],
        ...channelAttributes,
      } as IChannel,
      message: 'Subscribed',
    },
    statusCode: 200,
  })
}

export default subscribe
