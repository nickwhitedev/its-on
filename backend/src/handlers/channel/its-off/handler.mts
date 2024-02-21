import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import itsOff from './its-off.mjs'

const logger = new Logger({ serviceName: 'itsOnItsOff' })
const metrics = new Metrics({
  serviceName: 'itsOnItsOff',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => itsOff(event, context, logger))
