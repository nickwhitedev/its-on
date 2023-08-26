import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { version as uuidVersion } from 'uuid'

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
  console.info('received:', event)

  const channelID = event.pathParameters?.channelID ?? '' // is composite id
  const userID = event.requestContext.authorizer?.claims.sub

  if (uuidVersion(channelID) === 1) {
    // Subscriptions should only be for public copies of channels
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Forbidden' }),
    }
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
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Not found' }),
      }
    }
    const { pk, sk, ...channelInfo } = ddbResponse.Item
    channelAttributes = channelInfo
    console.info('Get public channel info: ', ddbResponse)
  } catch (err) {
    console.error('Get public channel error', err)
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Something went wrong' }),
    }
  }

  const params = {
    RequestItems: {
      [DYNAMODB_TABLE_NAME]: [
        {
          PutRequest: {
            Item: {
              pk: `user#${userID}`,
              sk: `subscription#${channelID}`,
              ...channelAttributes,
            },
          },
        },
        {
          PutRequest: {
            Item: {
              pk: `channel#${channelID}`,
              sk: `subscriber#${userID}`,
              username:
                event.requestContext.authorizer?.claims['cognito:username'],
            },
          },
        },
      ],
    },
  }

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(new BatchWriteCommand(params))
    statusCode = 200
    responseBody = { message: 'Subscribed' }
    console.info('Success - items added or updated', ddbResponse)
  } catch (err) {
    statusCode = 400
    console.error('Error', err.stack)
    responseBody = { message: 'Something went wrong' }
  }

  const response = {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  }

  console.info(`response from: ${event.path}: `, {
    statusCode: response.statusCode,
    body: responseBody,
  })

  return response
}
