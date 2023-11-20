import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME, ENV } from '/opt/nodejs/constants.js'
import { getChannel } from '/opt/nodejs/dynamo.js'
import { ChannelCopyTypeEnum } from '/opt/nodejs/enums.js'
import { createResponse } from '/opt/nodejs/response.js'

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
  if (ENV !== 'prod') {
    console.debug('received:', event)
  }

  const eventPath = event.path

  const channelID = event.pathParameters?.channelID ?? ''
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  // get channel ownerID
  let channelOwnerID
  let channelIsDeleted
  try {
    const subscriberChannelCopy = await getChannel({
      channelID,
      ddbDocClient,
      userID,
      copyType: ChannelCopyTypeEnum.SUBSCRIBER,
    })
    channelOwnerID = subscriberChannelCopy?.ownerID
    channelIsDeleted = subscriberChannelCopy?.deleted
    if (ENV !== 'prod') {
      console.debug("Get subscriber's channel copy: ", subscriberChannelCopy)
    }
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
    if (ENV !== 'prod') {
      console.debug('Success - items added or updated', ddbResponse)
    }
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

  updateSubscriberCount: try {
    if (channelOwnerID == null || channelIsDeleted === true)
      break updateSubscriberCount
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${channelOwnerID}`,
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
          ':subscriptionCount': -1,
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
    responseBody: { message: 'Unsubscribed' },
    statusCode: 200,
  })
}
