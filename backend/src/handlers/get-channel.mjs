import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants.mjs'
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { version as uuidVersion, v5 as uuidv5 } from 'uuid'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { serializeQueryResponse } from '../utils/serialize.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get info for a channel
 */
export const getChannelHandler = async event => {
  console.info('received:', event)

  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accept GET method, you tried: ${event.httpMethod}`,
    )
  }

  const channelID = event.pathParameters.channelID

  let statusCode
  let responseBody

  switch (uuidVersion(channelID)) {
    case 1:
      const userID = event.requestContext.authorizer.claims.sub

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
        const channelInfo = ddbResponse.Item
        statusCode = channelInfo == null ? 404 : 200
        responseBody = channelInfo ?? { message: 'Not found' }
        console.info('Success - Get private channel info: ', ddbResponse)
      } catch (err) {
        statusCode = 400
        responseBody = { message: 'Something went wrong' }
        console.error('Error', err)
      }

      if (statusCode !== 200) break

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
        const channelInfo = ddbResponse.Item
        statusCode = channelInfo == null ? 404 : 200
        responseBody = channelInfo ?? { message: 'Not found' }
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
