import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import subscribe from './subscribe.mjs'

const logger = new Logger({ serviceName: 'itsOnSubscribe' })
const metrics = new Metrics({
  serviceName: 'itsOnSubscribe',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => subscribe(event, context, logger, metrics))
