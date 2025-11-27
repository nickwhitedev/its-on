import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from 'opt/nodejs/common/constants.mjs'
import { createResponse } from 'opt/nodejs/common/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Unsubscribes the authenticated user to a channel
 */
const unsubscribe = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path

  const channelID = event.pathParameters?.channelID ?? ''
  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  try {
    const ddbResponse = await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE_NAME]: [
            {
              DeleteRequest: {
                Key: {
                  pk: `user#${userID}`,
                  sk: `subscription#${channelID}`,
                },
              },
            },
            {
              DeleteRequest: {
                Key: {
                  pk: `channel#${channelID}`,
                  sk: `subscriber#${userID}`,
                },
              },
            },
          ],
        },
      }),
    )
    logger.debug('Success - items added or updated', { ddbResponse })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  metrics.addMetric('UnsubscribeFromChannel', MetricUnit.Count, 1)

  return createResponse({
    eventPath,
    responseBody: { message: 'Unsubscribed' },
    statusCode: 200,
  })
}

export default unsubscribe
