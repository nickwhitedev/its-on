import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import updateChannel from './update-channel.mjs'

const logger = new Logger({ serviceName: 'itsOnUpdateChannel' })
const metrics = new Metrics({
  serviceName: 'itsOnUpdateChannel',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => updateChannel(event, context, logger, metrics))
