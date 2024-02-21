import { Logger } from '@aws-lambda-powertools/logger'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'
import { serializeQueryResponse } from '/opt/nodejs/serialize.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Get all of a user's data
 *
 * Includes user info, channels, and subscriptions.
 */
const getOverview = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getOverview only accept GET method, you tried: ${event.httpMethod}`,
    )
  }

  const eventPath = event.path
  const userID = (event.requestContext.authorizer?.sub ?? '') as string

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
    logger.debug('Successful user partition query', { ddbResponse })

    const data = serializeQueryResponse(
      ddbResponse.Items ?? [],
    ) as IOverviewResponse

    if (!('profile' in data)) {
      const userAttributes = {
        channelCount: 0,
        notificationsEnabled: true,
        subscriptionCount: 0,
        tier: 5,
        username: (event.requestContext.authorizer?.username ?? '') as string,
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
        logger.debug('Successful user profile write')

        data.profile = userAttributes
      } catch (error) {
        logger.error({
          message: 'write user profile failed: ',
          error: error as Error,
        })
        return createResponse({
          eventPath,
          responseBody: { message: 'Something went wrong' },
          statusCode: 400,
        })
      }
    }

    logger.info('Overview fetched', { userID })

    return createResponse({
      eventPath,
      responseBody: data,
      statusCode: 200,
    })
  } catch (error) {
    logger.error({ message: 'DynamoDB Query Error: ', error: error as Error })
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}

export default getOverview
