import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import itsOn from './its-on.mjs'

const logger = new Logger({ serviceName: 'itsOnItsOn' })
const metrics = new Metrics({
  serviceName: 'itsOnItsOn',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => itsOn(event, context, logger, metrics))
