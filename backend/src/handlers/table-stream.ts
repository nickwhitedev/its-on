import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBStreamEvent } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '../utils/constants'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Handles updates to the dynamo table
 */
export const tableStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.log('Received event:', JSON.stringify(event, null, 2))
  for (const record of event.Records) {
    if (
      record.eventName !== 'MODIFY' ||
      !record.dynamodb?.Keys?.sk?.S?.startsWith('channel') ||
      record.dynamodb.NewImage == null
    ) {
      return
    }
    let channelInfo: IDynamoChannelItem

    // get channel partition
    try {
      channelInfo = {
        note: record.dynamodb.NewImage.note.S ?? '',
        on: record.dynamodb.NewImage.on.BOOL ?? false,
        owner: record.dynamodb.NewImage.owner.S ?? '',
        pk: record.dynamodb.NewImage.pk.S ?? '',
        sk: record.dynamodb.NewImage.sk.S ?? '',
        title: record.dynamodb.NewImage.title.S ?? '',
      }
    } catch (error) {
      console.error('Unexpected error with fields: ', error)
      return
    }

    let items: IDynamoChannelItem[] | null
    const channelID = channelInfo.sk.substring(channelInfo.sk.indexOf('#') + 1)

    try {
      const ddbResponse = await ddbDocClient.send(
        new QueryCommand({
          TableName: DYNAMODB_TABLE_NAME,
          KeyConditionExpression: 'pk = :pkval',
          ExpressionAttributeValues: { ':pkval': `channel#${channelID}` },
        }),
      )
      items = ddbResponse.Items as IDynamoChannelItem[] | null
      console.info('Get public channel and subscribers: ', ddbResponse)
    } catch (err) {
      console.error('Get public channel error', err)
      return
    }

    if (items == null || items.length === 0) {
      // Put a public channel if it doesn't already exist
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Item: {
              ...channelInfo,
              pk: `channel#${channelID}`,
              sk: 'info',
            },
          }),
        )
        console.info('Successful batch write')
      } catch (err) {
        console.error('batch write failed: ', err)
        return
      }
      return
    }

    // bulk write all channel copies
    try {
      await ddbDocClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [DYNAMODB_TABLE_NAME]: items.map(item => {
              const { pk: currentPK, sk: currentSK } = item
              return {
                PutRequest: {
                  Item: {
                    ...channelInfo,
                    pk:
                      currentSK === 'info'
                        ? currentPK
                        : `user#${currentSK.substring(
                            currentSK.indexOf('#') + 1,
                          )}`,
                    sk:
                      currentSK === 'info'
                        ? currentSK
                        : `subscription#${currentPK.substring(
                            currentPK.indexOf('#') + 1,
                          )}`,
                  },
                },
              }
            }),
          },
        }),
      )
      console.info('Successful batch write')
    } catch (err) {
      console.error('batch write failed: ', err)
      return
    }

    // TODO: send notifications if it's on
  }
  return `Successfully processed ${event.Records.length} records.`
}
