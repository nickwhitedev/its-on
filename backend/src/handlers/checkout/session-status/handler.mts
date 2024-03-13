import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import getCheckoutSession from './get-checkout-session.mjs'

const logger = new Logger({ serviceName: 'itsOnGetCheckoutSession' })
const metrics = new Metrics({
  serviceName: 'itsOnGetCheckoutSession',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => getCheckoutSession(event, context, logger))
