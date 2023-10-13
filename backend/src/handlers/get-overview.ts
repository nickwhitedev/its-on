import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
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
  const userID =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (event.requestContext.authorizer?.claims?.sub as string | null) ?? ''

  try {
    const ddbResponse = await ddbDocClient.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        KeyConditionExpression: '#pk = :userID',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':userID': `user#${userID}`,
        },
      }),
    )
    console.info('Successful user partition query - data: ', ddbResponse)

    const data = serializeQueryResponse(
      ddbResponse.Items ?? [],
    ) as IOverviewResponse

    if (!('profile' in data)) {
      const userAttributes = {
        subscriptionCount: 0,
        tier: 5,
        username:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (event.requestContext.authorizer?.claims['cognito:username'] ??
            '') as string,
      }
      // Put a user profile item
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Item: {
              pk: `user#${userID}`,
              sk: 'profile',
              ...userAttributes,
            } as IDynamoUserItem,
          }),
        )
        console.info('Successful user profile write')

        data.profile = userAttributes
      } catch (error) {
        console.error('write user profile failed: ', error)
        return createResponse({
          eventPath,
          responseBody: { message: 'Something went wrong' },
          statusCode: 400,
        })
      }
    }

    return createResponse({
      eventPath,
      responseBody: data,
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
