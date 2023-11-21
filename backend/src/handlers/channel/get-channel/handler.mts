import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import getChannel from './get-channel.mjs'

const logger = new Logger({ serviceName: 'itsOnGetChannel' })
const metrics = new Metrics({
  serviceName: 'itsOnGetChannel',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => getChannel(event, context, logger))
