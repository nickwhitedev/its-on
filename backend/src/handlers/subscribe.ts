import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getChannel } from '../utils/dynamo'

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''
  const channelID = event.pathParameters?.channelID ?? '' // is composite id

  let privateChannel: IDynamoChannelItem | undefined
  // get private channel entry
  try {
    privateChannel = await getChannel({channelID, ddbDocClient, userID})
  } catch (_error) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Something went wrong' }),
    }
  }

  if (privateChannel != null) {
    // Subscriptions should only be for public copies of channels
    console.info('User owns channel')
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
    const {
      pk: _pk,
      sk: _sk,
      ...channelInfo
    } = ddbResponse.Item as IDynamoChannelItem
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              username:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
    console.error('Error', err instanceof Error ? err.stack : 'Unknown Type')
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
