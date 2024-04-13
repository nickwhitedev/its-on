import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import {
  getUserInfo,
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

export const handleSubscriptionAdded = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  try {
    await initializeFirebase()
  } catch (error) {
    logger.error('Failed to initialize Firebase', error as Error)
  }

  const subscriptionPK = record.dynamodb?.Keys?.pk?.S ?? ''
  const userID = subscriptionPK.substring(subscriptionPK.indexOf('#') + 1)

  const subscriptionSK = record.dynamodb?.Keys?.sk?.S ?? ''
  const channelID = subscriptionSK.substring(subscriptionSK.indexOf('#') + 1)

  const channelOwnerID = record.dynamodb?.NewImage?.ownerID?.S ?? ''

  // Increment user's subscription count (if user still exists)
  if ((await getUserInfo({ ddbDocClient, userID })) == null) {
    return
  }
  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `profile`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression:
          'ADD #subscriptionCount :subscriptionCount, #subscriptionTopics :subscriptionTopic',
        ExpressionAttributeNames: {
          '#subscriptionCount': 'subscriptionCount',
          '#subscriptionTopics': 'subscriptionTopic',
        },
        ExpressionAttributeValues: {
          ':subscriptionCount': 1,
          ':subscriptionTopic': new Set([
            getMessagingChannelTopic({ channelID, channelOwnerID }),
          ]),
        },
      }),
    )
    logger.debug('Success - subscription count updated', { ddbResponse })
  } catch (error) {
    logger.error('Subscription count increment error', error as Error)
  }

  // Subscribe user to channel notification topic
  try {
    const subscriberNotificationSubscriptions =
      await getUserNotificationSubscriptions({
        ddbDocClient,
        userID,
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
