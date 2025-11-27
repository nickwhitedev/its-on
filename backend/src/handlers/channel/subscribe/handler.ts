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
import subscribe from './subscribe.js'

const logger = new Logger({ serviceName: 'itsOnSubscribe' })
const metrics = new Metrics({
  serviceName: 'itsOnSubscribe',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event: APIGatewayProxyEvent, context: Context) =>
    subscribe(event, context, logger, metrics),
  )
