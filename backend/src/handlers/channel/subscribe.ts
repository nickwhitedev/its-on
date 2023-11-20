import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME, ENV } from '/opt/nodejs/constants.js'
import { getChannel, getUserInfo } from '/opt/nodejs/dynamo.js'
import { createResponse } from '/opt/nodejs/response.js'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Subscribes the authenticated user to a channel
 */
export const subscribeHandler = async (
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
    console.error('Error getting private channel: ', error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  if (privateChannel != null) {
    // Subscriptions should only be for public copies of channels
    if (ENV !== 'prod') {
      console.debug('User owns channel')
    }
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
    if (ENV !== 'prod') {
      console.debug('Get public channel info: ', publicChannel)
    }
  } catch (error) {
    console.error('Get public channel error', error)
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
    if (ENV !== 'prod') {
      console.debug('Success - items added or updated', ddbResponse)
    }
  } catch (error) {
    console.error(
      'Batch Write Error',
      error instanceof Error ? error.stack : 'Unknown Type',
    )
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
    if (ENV !== 'prod') {
      console.debug('Success - subscriber count updated', ddbResponse)
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
    if (ENV !== 'prod') {
      console.debug('Success - subscription count updated', ddbResponse)
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
    responseBody: { message: 'Subscribed' },
    statusCode: 200,
  })
}
