import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware'
import middy from '@middy/core'
import { Context, DynamoDBStreamEvent } from 'aws-lambda'
import processTableStream from './table-stream.js'

const logger = new Logger({ serviceName: 'itsOnTableStream' })
const metrics = new Metrics({
  serviceName: 'itsOnTableStream',
})

export const handler = middy<DynamoDBStreamEvent>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event: DynamoDBStreamEvent, context: Context) =>
    processTableStream(event, context, logger, metrics),
  )
