import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import createChannel from './create-channel.mjs'

const logger = new Logger({ serviceName: 'itsOnCreateChannel' })
const metrics = new Metrics({
  serviceName: 'itsOnCreateChannel',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => createChannel(event, context, logger, metrics))
