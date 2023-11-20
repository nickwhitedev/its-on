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
 * Removes a given subscriber from a channel for the authenticated user
 */
export const removeChannelSubscriberHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'DELETE') {
    throw new Error(
      `Delete method only accepts DELETE method, you tried: ${event.httpMethod} method.`,
    )
  }
  if (ENV !== 'prod') {
    console.debug('received:', event)
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  let username = ''
  try {
    const userInfo = await getUserInfo({ ddbDocClient, userID })
    username = userInfo?.username ?? ''
  } catch (error) {
    console.error('gerUserInfo error: ', error)
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
    if (ENV !== 'prod') {
      console.debug('Get public channel info: ', publicChannel)
    }
  } catch (error) {
    console.error('Get public channel error', error)
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
    if (ENV !== 'prod') {
      console.debug('Success - user unsubscribed from channel', ddbResponse)
    }
  } catch (err) {
    // TODO: Error handling - make more robust
    console.error('Error', err instanceof Error ? err.stack : 'Unknown Type')
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
          sk: `channel#${channelID}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'ADD #subscriberCount :subscriberCount',
        ExpressionAttributeNames: {
          '#subscriberCount': 'subscriberCount',
        },
        ExpressionAttributeValues: {
          ':subscriberCount': -1,
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

  return createResponse({
    eventPath,
    responseBody: { message: 'Subscriber removed' },
    statusCode: 204,
  })
}
