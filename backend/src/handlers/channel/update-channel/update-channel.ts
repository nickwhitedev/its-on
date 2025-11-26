import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import { getChannel, getUserInfo } from '../../../common/dynamo.js'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.js'
import { createResponse } from '../../../common/response.js'
import { MS_IN_HOUR } from '../../../common/time.js'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Updates a channel for the authenticated user
 */
const updateChannel = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'PUT') {
    throw new Error(
      `putMethod only accepts PUT method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path

  const channelID = event.pathParameters?.channelID

  if (channelID == null) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Bad Request' },
      statusCode: 400,
    })
  }

  const userID = (event.requestContext.authorizer?.sub ?? '') as string
  let userInfo
  try {
    userInfo = await getUserInfo({ ddbDocClient, userID })
  } catch (error) {
    logger.error('Get User Info Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
  const userTier = userInfo?.tier ?? 5

  let channelIsNotOwnedByUser: boolean
  try {
    channelIsNotOwnedByUser =
      (await getChannel({ channelID, ddbDocClient, userID })) == null
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
  if (channelIsNotOwnedByUser) {
    return createResponse({
      eventPath,
      responseBody: {
        message: 'You may only update a channel you own',
      },
      statusCode: 403,
    })
  }

  const {
    capacity = userTier,
    duration = MS_IN_HOUR,
    note = '',
    title = '',
  } = JSON.parse(event.body ?? '{}') as IChannel

  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `channel#${channelID}`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression:
          'SET #capacity = :capacity, #duration = :duration, #lastUpdated = :lastUpdated, #note = :note, #title = :title',
        ExpressionAttributeNames: {
          '#capacity': 'capacity',
          '#duration': 'duration',
          '#lastUpdated': 'lastUpdated',
          '#note': 'note',
          '#title': 'title',
        },
        ExpressionAttributeValues: {
          ':capacity': capacity > userTier ? userTier : Math.floor(capacity),
          ':duration': duration,
          ':lastUpdated': event.requestContext.requestTimeEpoch,
          ':note': note.substring(0, 200),
          ':title': title.substring(0, 40),
        },
      }),
    )
    logger.debug('Success - item updated', { ddbResponse })
    metrics.addMetric('channelUpdated', MetricUnit.Count, 1)
    return createResponse({
      eventPath,
      responseBody: { message: 'Updated' },
      statusCode: 200,
    })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}

export default updateChannel
