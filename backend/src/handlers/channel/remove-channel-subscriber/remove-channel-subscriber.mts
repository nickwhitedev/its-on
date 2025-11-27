import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from 'opt/nodejs/common/constants.mjs'
import { getChannel, getUserInfo } from 'opt/nodejs/common/dynamo.mjs'
import { createResponse } from 'opt/nodejs/common/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Removes a given subscriber from a channel for the authenticated user
 */
const removeChannelSubscriber = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'DELETE') {
    throw new Error(
      `Delete method only accepts DELETE method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path
  const channelID = event.pathParameters?.channelID
  const subscriberID = event.pathParameters?.subscriberID

  if (channelID == null || subscriberID == null) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Bad Request' },
      statusCode: 400,
    })
  }

  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  let username = ''
  try {
    const userInfo = await getUserInfo({ ddbDocClient, userID })
    username = userInfo?.username ?? ''
  } catch (error) {
    logger.error('gerUserInfo error: ', error as Error)
  }

  // get public channel info
  const defaultUnsubscribedChannelTitle = 'Unknown Channel'
  let channelTitle = defaultUnsubscribedChannelTitle
  getPublicChannel: try {
    const publicChannel = await getChannel({ channelID, ddbDocClient })
    if (publicChannel == null) {
      break getPublicChannel
    }
    channelTitle = publicChannel.title ?? defaultUnsubscribedChannelTitle
    logger.debug('Get public channel info: ', { channel: publicChannel })
  } catch (error) {
    logger.error('Get public channel error', error as Error)
  }

  try {
    const ddbResponse = await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE_NAME]: [
            {
              DeleteRequest: {
                Key: {
                  pk: `channel#${channelID}`,
                  sk: `subscriber#${subscriberID}`,
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  deleted: true,
                  duration: 0,
                  note: '',
                  lastOn: 0,
                  owner: username,
                  pk: `user#${subscriberID}`,
                  sk: `subscription#${channelID}`,
                  title: channelTitle,
                } as IDynamoChannelItem,
              },
            },
          ],
        },
      }),
    )
    logger.debug('Success - user unsubscribed from channel', { ddbResponse })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  metrics.addMetric('subscriberRemoved', MetricUnit.Count, 1)

  return createResponse({
    eventPath,
    responseBody: { message: 'Subscriber removed' },
    statusCode: 204,
  })
}

export default removeChannelSubscriber
