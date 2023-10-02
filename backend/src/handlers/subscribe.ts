import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { getChannel } from '../utils/dynamo'
import { createResponse } from '../utils/response'

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

  if (privateChannel != null) {
    // Subscriptions should only be for public copies of channels
    console.info('User owns channel')
    return createResponse({
      eventPath,
      responseBody: {
        message: 'You cannot subscribe to a channel you own',
      },
      statusCode: 403,
    })
  }

  let channelAttributes

  // get public channel info
  try {
    const ddbResponse = await ddbDocClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          pk: `channel#${channelID}`,
          sk: 'info',
        },
      }),
    )
    if (ddbResponse.Item == null) {
      return createResponse({
        eventPath,
        responseBody: { message: 'Not found' },
        statusCode: 404,
      })
    }
    const {
      pk: _pk,
      sk: _sk,
      ...channelInfo
    } = ddbResponse.Item as IDynamoChannelItem
    channelAttributes = channelInfo
    console.info('Get public channel info: ', ddbResponse)
  } catch (error) {
    console.error('Get public channel error', error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
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
    console.info('Success - items added or updated', ddbResponse)
    return createResponse({
      eventPath,
      responseBody: { message: 'Subscribed' },
      statusCode: 200,
    })
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
}
