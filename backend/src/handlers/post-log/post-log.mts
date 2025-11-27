import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics'
import { LogLevel } from 'esbuild'
import { createResponse } from '../../common/response.mjs'

interface IPayload {
  log: {
    message: string
    [key: string]: unknown
  }
  logLevel: Uppercase<LogLevel>
}

/**
 * Handles a log from the front-end
 */
const postLog = async (
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
  const eventBody = JSON.parse(event.body ?? '{}') as IPayload
  const log = eventBody.log
  const logLevel = eventBody.logLevel

  if (eventBody.logLevel === 'ERROR') {
    logger.error({ logLevel, userID, ...log })
  } else if (eventBody.logLevel === 'WARNING') {
    logger.warn({ logLevel, userID, ...log })
  } else {
    logger.info({ logLevel, userID, ...log })
  }

  metrics.addMetric('frontendLogs', MetricUnit.Count, 1)

  return new Promise(resolve => {
    resolve(
      createResponse({
        eventPath,
        responseBody: {
          message: 'Success',
        },
        statusCode: 200,
      }),
    )
  })
}

export default postLog
