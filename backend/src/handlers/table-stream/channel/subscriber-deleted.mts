import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { getChannel } from '/opt/nodejs/dynamo.mjs'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleChannelSubscriberDeleted = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const subscriberPK = record.dynamodb?.Keys?.pk.S ?? ''
  const channelID = subscriberPK.substring(subscriberPK.indexOf('#') + 1)

  const channel = await getChannel({ channelID, ddbDocClient })
  const channelOwnerID = channel?.ownerID ?? ''

  // Reduce channel's subscriber count (if channel still exists)
  if (
    (await getChannel({
      channelID,
      ddbDocClient,
      userID: channelOwnerID,
    })) != null
  ) {
    try {
      const ddbResponse = await ddbDocClient.send(
        new UpdateCommand({
          Key: {
            pk: `user#${channelOwnerID}`,
            sk: `channel#${channelID}`,
          },
          ReturnValues: 'ALL_NEW',
          TableName: DYNAMODB_TABLE_NAME,
          UpdateExpression: 'ADD #subscriberCount :subscriberCount',
          ExpressionAttributeNames: {
            '#subscriberCount': 'subscriberCount',
          },
          ExpressionAttributeValues: {
            ':subscriberCount': -1,
          },
        }),
      )
      logger.debug('Success - subscriber count updated', { ddbResponse })
    } catch (error) {
      logger.error('Subscriber count decrement error', error as Error)
    }
  }
}
