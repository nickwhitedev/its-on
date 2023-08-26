import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { serializeQueryResponse } from '../utils/serialize'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get all of a user's data
 *
 * Includes user info, channels, and subscriptions.
 */
export const getOverviewHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getOverview only accept GET method, you tried: ${event.httpMethod}`,
    )
  }
  console.info('received:', event)

  var params = {
    TableName: DYNAMODB_TABLE_NAME,
    KeyConditionExpression: '#pk = :userID',
    ExpressionAttributeNames: {
      '#pk': 'pk',
    },
    ExpressionAttributeValues: {
      ':userID': `user#${event.requestContext.authorizer?.claims.sub}`,
    },
  }

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
