import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import stripeWebhook from './stripe-webhook.mjs'

const logger = new Logger({ serviceName: 'itsOnStripeWebhook' })
const metrics = new Metrics({
  serviceName: 'itsOnStripeWebhook',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event: APIGatewayProxyEvent, context: Context) =>
    stripeWebhook(event, context, logger, metrics),
  )
