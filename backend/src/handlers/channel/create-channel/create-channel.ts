import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import { getChannel, getUserInfo } from '../../../common/dynamo.js'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { customAlphabet } from 'nanoid'
import { alphanumeric } from 'nanoid-dictionary'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.js'
import { createResponse } from '../../../common/response.js'
import { MS_IN_HOUR } from '../../../common/time.js'

const nanoid = customAlphabet(alphanumeric, 11)

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  title: string
}

/**
 * Creates a channel for the authenticated user
 */
const createChannel = async (
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

  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  const userInfo = await getUserInfo({ ddbDocClient, userID })
  const userTier = userInfo?.tier ?? 5
  const username = userInfo?.username ?? ''

  if ((userInfo?.channelCount ?? 0) >= userTier) {
    return createResponse({
      eventPath,
      responseBody: { message: 'Upgrade to create more channels' },
      statusCode: 403,
    })
  }

  let channelID = nanoid()
  let channelIDIsTaken: boolean
  let channelIDAttempt = 1

  do {
    try {
      channelIDIsTaken = (await getChannel({ channelID, ddbDocClient })) != null
    } catch (error) {
      logger.error('Channel fetch failed', error as Error)
      return createResponse({
        eventPath,
        responseBody: { message: 'Something went wrong' },
        statusCode: 400,
      })
    }
    if (channelIDIsTaken) {
      logger.warn(
        `Collision detected. Generating id #${(++channelIDAttempt).toString()}`,
        {
          shortName: 'channelIDCollision',
        },
      )
      channelID = nanoid()
    }
  } while (channelIDIsTaken)

  const channelAttributes: Partial<IDynamoChannelItem> = {
    capacity: userTier,
    duration: MS_IN_HOUR,
    lastOn: 0,
    lastOnDuration: MS_IN_HOUR,
    lastUpdated: event.requestContext.requestTimeEpoch,
    note: '',
    owner: username,
    ownerID: userID,
    subscriberCount: 0,
    title: (JSON.parse(event.body ?? '{}') as IPayload).title.substring(0, 40),
  }

  try {
    const ddbResponse = await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMODB_TABLE_NAME]: [
            {
              PutRequest: {
                Item: {
                  pk: `user#${userID}`,
                  sk: `channel#${channelID}`,
                  ...channelAttributes,
                } as IDynamoChannelItem,
              },
            },
            {
              PutRequest: {
                Item: {
                  pk: `channel#${channelID}`,
                  sk: 'info',
                  ...channelAttributes,
                  lastUpdated: 0,
                } as IDynamoChannelItem,
              },
            },
          ],
        },
      }),
    )
    logger.debug('Success - item added or updated', ddbResponse)
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }

  metrics.addMetric('channelCreated', MetricUnit.Count, 1)

  return createResponse({
    eventPath,
    responseBody: {
      id: channelID,
      subscribers: [],
      ...channelAttributes,
    } as IChannel,
    statusCode: 201,
  })
}

export default createChannel
