import {
  DeleteCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnits, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const userID: string = event.requestContext.authorizer?.claims?.sub ?? ''

  try {
    const ddbResponse = await ddbDocClient.send(
      new DeleteCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${channelID}`,
        },
        TableName: DYNAMODB_TABLE_NAME,
      }),
    )
    logger.debug('Success - item deleted', { ddbResponse })
  } catch (error) {
    // TODO: Error handling - make more robust
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `profile`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'ADD #channelCount :channelCount',
        ExpressionAttributeNames: {
          '#channelCount': 'channelCount',
        },
        ExpressionAttributeValues: {
          ':channelCount': -1,
        },
      }),
    )
    logger.debug('Success - channel count updated', { ddbResponse })
  } catch (error) {
    logger.error('Update Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  metrics.addMetric('channelDeleted', MetricUnits.Count, 1)

  return createResponse({
    eventPath,
    responseBody: { message: 'Deleted' },
    statusCode: 204,
  })
}

export default deleteChannel
