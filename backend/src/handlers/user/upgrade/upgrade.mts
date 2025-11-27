import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME, TOP_TIER } from '../../../common/constants.mjs'
import { createResponse } from '../../../common/response.mjs'
import { getUserInfo } from '../../../common/dynamo.mjs'
import { getUpgradeTierForTier } from '../../../common/upgrade.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Upgrades tier for the authenticated user if they are eligible
 */
const upgrade = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  _metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path

  const userID = (event.requestContext.authorizer?.sub ?? '') as string

  const userProfile = await getUserInfo({ ddbDocClient, userID })

  if (!userProfile?.eligibleForUpgrade) {
    logger.info('User ineligible for upgrade')
    return createResponse({
      eventPath,
      responseBody: { message: 'You have not unlocked an upgrade.' },
      statusCode: 428,
    })
  }

  const newTier = getUpgradeTierForTier(userProfile.tier)

  if (userProfile.tier >= TOP_TIER || newTier == null) {
    logger.info('User has top tier already')
    return createResponse({
      eventPath,
      responseBody: { message: 'No upgrade available.' },
      statusCode: 417,
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
        UpdateExpression:
          'SET #eligibleForUpgrade = :eligibleForUpgrade, #tier = :tier, #upgradeQualifyingEventTimestamps = :upgradeQualifyingEventTimestamps',
        ExpressionAttributeNames: {
          '#eligibleForUpgrade': 'eligibleForUpgrade',
          '#tier': 'tier',
          '#upgradeQualifyingEventTimestamps':
            'upgradeQualifyingEventTimestamps',
        },
        ExpressionAttributeValues: {
          ':eligibleForUpgrade': false,
          ':tier': newTier,
          ':upgradeQualifyingEventTimestamps': [],
        },
      }),
    )
    logger.debug('Success - item updated', { ddbResponse })
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

export default upgrade
