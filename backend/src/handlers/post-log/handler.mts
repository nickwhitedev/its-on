import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import postLog from './post-log.mjs'

const logger = new Logger({ serviceName: 'itsOnPostLog' })
const metrics = new Metrics({
  serviceName: 'itsOnPostLog',
})
export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) => postLog(event, context, logger, metrics))
