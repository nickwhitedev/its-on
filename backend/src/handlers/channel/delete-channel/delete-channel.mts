import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
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
 * Deletes a channel for the authenticated user
 */
const deleteChannel = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'DELETE') {
    throw new Error(
      `Delete method only accepts DELETE method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path
  const channelID = event.pathParameters?.channelID

  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  try {
    const ddbResponse = await ddbDocClient.send(
      new DeleteCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${channelID ?? ''}`,
        },
        TableName: DYNAMODB_TABLE_NAME,
      }),
    )
    logger.debug('Success - item deleted', { ddbResponse })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  metrics.addMetric('channelDeleted', MetricUnit.Count, 1)

  return createResponse({
    eventPath,
    responseBody: { message: 'Deleted' },
    statusCode: 204,
  })
}

export default deleteChannel
