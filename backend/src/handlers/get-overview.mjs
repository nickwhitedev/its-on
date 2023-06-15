import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants.mjs'
const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get all of a user's data
 *
 * Includes user info, channels, and subscriptions.
 */
export const getOverviewHandler = async event => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getOverview only accept GET method, you tried: ${event.httpMethod}`,
    )
  }
  console.info('received:', event)

  var params = {
    TableName: DYNAMODB_TABLE_NAME,
    KeyConditionExpression: '#pk = :userId',
    ExpressionAttributeNames: {
      '#pk': 'pk',
    },
    ExpressionAttributeValues: {
      ':userId': `user#${event.requestContext.authorizer.claims.sub}`,
    },
  }

  let statusCode
  let responseBody = {}

  try {
    const ddbResponse = await ddbDocClient.send(new QueryCommand(params))
    statusCode = 200
    ddbResponse.Items?.forEach(item => {
      const isPluralItemType = item.sk.includes('#')
      const itemKey = isPluralItemType
        ? `${item.sk.substring(0, item.sk.indexOf('#'))}s`
        : item.sk

      if (!isPluralItemType) {
        responseBody[itemKey] = item
        return
      }

      if (!Object.hasOwn(responseBody, itemKey)) responseBody[itemKey] = []
      responseBody[itemKey].push(item)
    })
    console.info('Success - data: ', ddbResponse)
  } catch (err) {
    statusCode = 400
    responseBody.message = 'Something went wrong'
    console.error('Error', err)
  }

  const response = {
    statusCode: statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  }

  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`,
  )
  return response
}
