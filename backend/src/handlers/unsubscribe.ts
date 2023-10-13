import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { getChannel } from '../utils/dynamo'
import { createResponse } from '../utils/response'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Unsubscribes the authenticated user to a channel
 */
export const unsubscribeHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.debug('received:', event)

  const eventPath = event.path

  const channelID = event.pathParameters?.channelID ?? ''
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  try {
    const ddbResponse = await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE_NAME]: [
            {
              DeleteRequest: {
                Key: {
                  pk: `user#${userID}`,
                  sk: `subscription#${channelID}`,
                },
              },
            },
            {
              DeleteRequest: {
                Key: {
                  pk: `channel#${channelID}`,
                  sk: `subscriber#${userID}`,
                },
              },
            },
          ],
        },
      }),
    )
    console.info('Success - items added or updated', ddbResponse)
  } catch (error) {
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

  // get channel ownerID
  let channelOwnerID
  try {
    const publicChannel = await getChannel({ channelID, ddbDocClient })
    if (publicChannel == null) {
      return createResponse({
        eventPath,
        responseBody: { message: 'Not found' },
        statusCode: 404,
      })
    }
    const { ownerID } = publicChannel
    channelOwnerID = ownerID
    console.info('Get public channel info: ', publicChannel)
  } catch (error) {
    console.error('Get public channel error', error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  updateSubscriberCount: try {
    if (channelOwnerID == null) break updateSubscriberCount
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${channelOwnerID}`,
          sk: `channel#${channelID}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'ADD #subscriberCount = :subscriberCount',
        ExpressionAttributeNames: {
          '#subscriberCount': 'subscriberCount',
        },
        ExpressionAttributeValues: {
          ':subscriberCount': -1,
        },
      }),
    )
    console.info('Success - subscriber count updated', ddbResponse)
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
        UpdateExpression: 'ADD #subscriptionCount = :subscriptionCount',
        ExpressionAttributeNames: {
          '#subscriptionCount': 'subscriptionCount',
        },
        ExpressionAttributeValues: {
          ':subscriptionCount': -1,
        },
      }),
    )
    console.info('Success - subscription count updated', ddbResponse)
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
    responseBody: { message: 'Unsubscribed' },
    statusCode: 200,
  })
}
