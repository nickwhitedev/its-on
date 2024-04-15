import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import removeChannelSubscriber from './remove-channel-subscriber.mjs'

const logger = new Logger({ serviceName: 'itsOnRemoveChannelSubscriber' })
const metrics = new Metrics({
  serviceName: 'itsOnRemoveChannelSubscriber',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) =>
    removeChannelSubscriber(event, context, logger, metrics),
  )
