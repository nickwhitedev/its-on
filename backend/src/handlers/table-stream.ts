import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { DynamoDBStreamEvent } from 'aws-lambda'
import { handleModifyEvent } from '../table-stream/modify'
import { handleRemoveEvent } from '../table-stream/remove'

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))

/**
 * Handles updates to the dynamo table
 */
export const tableStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.debug('Received event:', JSON.stringify(event, null, 2))
  for (const record of event.Records) {
    switch (record.eventName) {
      case 'MODIFY': {
        try {
          await handleModifyEvent(record, ddbDocClient)
        } catch (error) {
          console.error('Modify handler failed: ', error)
        }
        break
      }
      case 'REMOVE': {
        try {
          await handleRemoveEvent(record, ddbDocClient)
        } catch (error) {
          console.error('Remove handler failed: ', error)
        }
        break
      }
      default:
        console.info(`Unsupported dynamo event: ${record.eventName}`)
        return
    }
  }
  return `Successfully processed ${event.Records.length} records.`
}
