import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import {
  getChannel,
  getUserNotificationSubscriptions,
} from '/opt/nodejs/dynamo.mjs'
import {
  getMessagingChannelTopic,
  initializeFirebase,
} from '/opt/nodejs/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleChannelSubscriberAdded = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  await initializeFirebase()

  const subscriberPK = record.dynamodb?.Keys?.pk?.S ?? ''
  const channelID = subscriberPK.substring(subscriberPK.indexOf('#') + 1)

  const subscriberSK = record.dynamodb?.Keys?.sk?.S ?? ''
  const subscriberID = subscriberSK.substring(subscriberSK.indexOf('#') + 1)

  const channel = await getChannel({ channelID, ddbDocClient })
  const channelOwnerID = channel?.ownerID ?? ''

  // Increment channel's subscriber count (if channel still exists)
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
            ':subscriberCount': 1,
          },
        }),
      )
      logger.debug('Success - subscriber count updated', { ddbResponse })
    } catch (error) {
      logger.error('Subscriber count increment error', error as Error)
    }

    // Subscribe user to channel notification topic
    try {
      const subscriberNotificationSubscriptions =
        await getUserNotificationSubscriptions({
          ddbDocClient,
          userID: subscriberID,
        })
      if (subscriberNotificationSubscriptions != null) {
        await getMessaging().subscribeToTopic(
          Array.from(subscriberNotificationSubscriptions.tokens),
          getMessagingChannelTopic({ channelID, channelOwnerID }),
        )
      } else {
        logger.warn('Subscriber has no notification subscription tokens saved')
      }
    } catch (error) {
      logger.error('Subscribe user to channel topic failed', error as Error)
    }
  }
}
