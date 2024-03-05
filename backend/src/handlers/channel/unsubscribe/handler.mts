import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import unsubscribe from './unsubscribe.mjs'

const logger = new Logger({ serviceName: 'itsOnUnsubscribe' })
const metrics = new Metrics({
  serviceName: 'itsOnUnsubscribe',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => unsubscribe(event, context, logger, metrics))
