import {
  DynamoDBDocumentClient,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
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
  console.info('received:', event)

  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accept GET method, you tried: ${event.httpMethod}`,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''
  const channelID = event.pathParameters?.channelID

  if (channelID == null) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Bad Request' }),
    }
  }

  let statusCode
  let responseBody

  // get private channel entry
  let privateChannel: IDynamoChannelItem | undefined
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
    const {
      pk: _pk,
      sk: _sk,
      ...channelInfo
    } = privateChannel
    statusCode = 200
    responseBody = {
      id: channelID,
      ...channelInfo,
    }

    // query channel partition
    try {
      const ddbResponse = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression: '#pk = :channelID',
          ExpressionAttributeNames: {
            '#pk': 'pk',
          },
          ExpressionAttributeValues: {
            ':channelID': `channel#${channelID}`,
          },
        }),
      )
      responseBody = {
        ...responseBody,
        ...serializeQueryResponse(
          ddbResponse.Items?.filter(item => item.sk !== 'info') ?? [],
        ),
      }
      console.info('Success - channel owner data: ', ddbResponse)
    } catch (error) {
      console.error('Dynamo Query Error', error)
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Something went wrong' }),
      }
    }
  } else {
    // User doesn't own channel
    // get public channel info
    let publicChannel: IDynamoChannelItem | undefined
    try {
      publicChannel = await getChannel({channelID, ddbDocClient})
    } catch (_error) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Something went wrong' }),
      }
    }
    
    if (publicChannel == null) {
      console.info('Channel not found')
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Not found' }),
      }
    }

    const {
      pk,
      sk: _sk,
      ...channelInfo
    } = publicChannel

    statusCode = 200
    responseBody = {
      id: pk.substring(pk.indexOf('#') + 1),
      ...channelInfo,
    }
  }

  console.info(`response from: ${event.path}: `, {
    statusCode,
    responseBody,
  })

  return {
    statusCode: statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  }
}
