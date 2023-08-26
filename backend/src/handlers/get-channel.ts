import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { version as uuidVersion, v5 as uuidv5 } from 'uuid'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
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

  switch (uuidVersion(channelID)) {
    case 1: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

      // get private channel entry
      try {
        const ddbResponse = await ddbDocClient.send(
          new GetCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Key: {
              pk: `user#${userID}`,
              sk: `channel#${channelID}`,
            },
          }),
        )
        if (ddbResponse.Item == null) {
          statusCode = 404
          responseBody = { message: 'Not found' }
          break
        }
        const {
          pk: _pk,
          sk,
          ...channelInfo
        } = ddbResponse.Item as IDynamoChannelItem
        statusCode = 200
        responseBody = {
          id: sk.substring(sk.indexOf('#') + 1),
          ...channelInfo,
        }
        console.info('Success - Get private channel info: ', ddbResponse)
      } catch (err) {
        statusCode = 400
        responseBody = { message: 'Something went wrong' }
        console.error('Error', err)
        break
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
              ':channelID': `channel#${uuidv5(userID, channelID)}`,
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
      } catch (err) {
        statusCode = 400
        responseBody = { message: 'Something went wrong' }
        console.error('Error', err)
      }
      break
    }
    case 5:
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
          statusCode = 404
          responseBody = { message: 'Not found' }
          break
        }
        const {
          pk,
          sk: _sk,
          ...channelInfo
        } = ddbResponse.Item as IDynamoChannelItem
        statusCode = 200
        responseBody = {
          id: pk.substring(pk.indexOf('#') + 1),
          ...channelInfo,
        }
        console.info('Success - Get public channel info: ', ddbResponse)
      } catch (err) {
        statusCode = 400
        responseBody = { message: 'Something went wrong' }
        console.error('Error', err)
      }
      break
    default:
      // return 400
      statusCode = 400
      responseBody = { message: 'Bad Request' }
  }

  const response = {
    statusCode: statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  }

  console.info(`response from: ${event.path}: `, {
    statusCode,
    responseBody,
  })

  return response
}
