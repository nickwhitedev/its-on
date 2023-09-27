import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'
import { createResponse } from '../utils/response'
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
  console.debug('received:', event)

  const eventPath = event.path

  try {
    const ddbResponse = await ddbDocClient.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        KeyConditionExpression: '#pk = :userID',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':userID': `user#${
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            event.requestContext.authorizer?.claims?.sub ?? ''
          }`,
        },
      }),
    )
    console.info('Success - data: ', ddbResponse)
    return createResponse({
      eventPath,
      responseBody: serializeQueryResponse(ddbResponse.Items ?? []),
      statusCode: 200,
    })
  } catch (error) {
    console.error('DynamoDB Query Error: ', error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}
