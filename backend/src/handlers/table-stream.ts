import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import { DynamoDBStreamEvent } from 'aws-lambda'
import { handleModifyEvent } from '../table-stream/modify'
import { handleRemoveEvent } from '../table-stream/remove'
const metrics = new Metrics({
  serviceName: 'table-stream',
})

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const logger = new Logger({ serviceName: 'itsOnTableStream' })

/**
 * Handles updates to the dynamo table
 */
export const tableStreamHandler = middy<DynamoDBStreamEvent>()
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .handler(async (event, _context) => {
    for (const record of event.Records) {
      switch (record.eventName) {
        case 'MODIFY': {
          try {
            await handleModifyEvent({ record, ddbDocClient, logger, metrics })
          } catch (error) {
            logger.error('Modify handler failed', error as Error)
          }
          break
        }
        case 'REMOVE': {
          try {
            await handleRemoveEvent({ record, ddbDocClient, logger })
          } catch (error) {
            logger.error('Remove handler failed', error as Error)
          }
          break
        }
        default:
          logger.warn(`Unhandled dynamo event: ${record.eventName}`, {
            record,
          })
          return
      }
    }
    return `Successfully processed ${event.Records.length} records.`
  })
