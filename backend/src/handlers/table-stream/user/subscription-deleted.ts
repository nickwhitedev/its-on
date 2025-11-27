import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.js'
import { getUserInfo } from '../../../common/dynamo.js'
import { getMessaging } from 'firebase-admin/messaging'
import {
  getMessagingChannelTopic,
  initializeFirebase,
} from '../../../common/firebase.js'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleSubscriptionDeleted = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  try {
    await initializeFirebase()
  } catch (error) {
    logger.error('Failed to initialize Firebase', error as Error)
  }

  const subscriptionPK = record.dynamodb?.Keys?.pk.S ?? ''
  const userID = subscriptionPK.substring(subscriptionPK.indexOf('#') + 1)

  const subscriptionSK = record.dynamodb?.Keys?.sk.S ?? ''
  const channelID = subscriptionSK.substring(subscriptionSK.indexOf('#') + 1)

  const channelOwnerID = record.dynamodb?.OldImage?.ownerID.S ?? ''

  const userInfo = await getUserInfo({ ddbDocClient, userID })

  if (userInfo == null) {
    return
  }

  const channelTopic = getMessagingChannelTopic({ channelID, channelOwnerID })

  // Reduce user's subscription count
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
          'ADD #subscriptionCount :subscriptionCount DELETE #subscriptionTopics :subscriptionTopic',
        ExpressionAttributeNames: {
          '#subscriptionCount': 'subscriptionCount',
          '#subscriptionTopics': 'subscriptionTopics',
        },
        ExpressionAttributeValues: {
          ':subscriptionCount': -1,
          ':subscriptionTopic': new Set([channelTopic]),
        },
      }),
    )
    logger.debug('Success - subscription count updated', { ddbResponse })
  } catch (error) {
    logger.error('Subscription count decrement error', error as Error)
  }

  // Unsubscribe user from channel notification topic
  try {
    const notificationTokens = Object.keys(userInfo.notificationTokens ?? {})
    if (notificationTokens.length > 0) {
      await getMessaging().unsubscribeFromTopic(
        notificationTokens,
        channelTopic,
      )
    } else {
      logger.warn('Subscriber has no notification subscription tokens saved')
    }
  } catch (error) {
    logger.error('Subscribe user to channel topic failed', error as Error)
  }
}
