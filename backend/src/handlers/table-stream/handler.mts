import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import middy from '@middy/core'
import { DynamoDBStreamEvent } from 'aws-lambda'
import processTableStream from './table-stream.mjs'

const logger = new Logger({ serviceName: 'itsOnTableStream' })
const metrics = new Metrics({
  serviceName: 'itsOnTableStream',
})

export const handler = middy<DynamoDBStreamEvent>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler((event, context) =>
    processTableStream(event, context, logger, metrics),
  )
