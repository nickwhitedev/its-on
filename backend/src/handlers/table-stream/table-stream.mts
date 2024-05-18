import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Context, DynamoDBStreamEvent } from 'aws-lambda'
import { handleInsertEvent } from './events/insert.mjs'
import { handleModifyEvent } from './events/modify.mjs'
import { handleRemoveEvent } from './events/remove.mjs'

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))

/**
 * Handles updates to the dynamo table
 */
const processTableStream = async (
  event: DynamoDBStreamEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
) => {
  for (const record of event.Records) {
    switch (record.eventName) {
      case 'INSERT': {
        try {
          await handleInsertEvent({ record, ddbDocClient, logger })
        } catch (error) {
          logger.error('Insert handler failed', error as Error)
        }
        break
      }
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
        logger.warn(
          `Unhandled dynamo event: ${record.eventID ?? 'undefined'}`,
          {
            record,
          },
        )
        return
    }
  }
  return `Successfully processed ${event.Records.length.toString()} records.`
}

export default processTableStream
