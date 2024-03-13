import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import createCheckoutSession from './create-checkout-session.mjs'

const logger = new Logger({ serviceName: 'itsOnCreateCheckoutSession' })
const metrics = new Metrics({
  serviceName: 'itsOnCreateCheckoutSession',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) =>
    createCheckoutSession(event, context, logger, metrics),
  )
