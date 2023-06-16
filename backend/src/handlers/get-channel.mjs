import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants.mjs'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { serializeQueryResponse } from '../utils/serialize.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get info for a channel
 */
export const getChannelHandler = async event => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accept GET method, you tried: ${event.httpMethod}`,
    )
  }
  console.info('received:', event)

  var params = {
    TableName: DYNAMODB_TABLE_NAME,
    KeyConditionExpression: '#pk = :channelID',
    ExpressionAttributeNames: {
      '#pk': 'pk',
    },
    ExpressionAttributeValues: {
      ':channelID': `channel#${event.pathParameters.channelID}`,
    },
  }

  // TODO: GetChannel - check if given channelID is uuid v1 or v5 and choose get or query accordingly

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(new QueryCommand(params))
    statusCode = 200
    responseBody = serializeQueryResponse(ddbResponse.Items ?? [])
    console.info('Success - data: ', ddbResponse)
  } catch (err) {
    statusCode = 400
    responseBody = { message: 'Something went wrong' }
    console.error('Error', err)
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
