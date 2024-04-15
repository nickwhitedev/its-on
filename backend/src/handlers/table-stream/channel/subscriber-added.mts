import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME, WEB_URL } from '/opt/nodejs/constants.mjs'
import { getChannel, getUserInfo } from '/opt/nodejs/dynamo.mjs'
import { getUserTopic } from '/opt/nodejs/firebase.mjs'
import { getMessaging } from 'firebase-admin/messaging'
import { MS_IN_HOUR } from '/opt/nodejs/time.mjs'
import { getNewSubscriberNotificationCooldown } from '/opt/nodejs/channel.mjs'

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
  const subscriberPK = record.dynamodb?.Keys?.pk?.S ?? ''
  const channelID = subscriberPK.substring(subscriberPK.indexOf('#') + 1)

  const channel = await getChannel({ channelID, ddbDocClient })
  const channelOwnerID = channel?.ownerID ?? ''

  if (
    (await getChannel({
      channelID,
      ddbDocClient,
      userID: channelOwnerID,
    })) == null
  ) {
    return
  }

  // Increment channel's subscriber count
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

  // Notifify channel owner of new subscriber
  try {
    const channelOwnerInfo = await getUserInfo({
      ddbDocClient,
      userID: channelOwnerID,
    })
    if (
      Date.now() - (channelOwnerInfo?.lastNewSubscriberNotification ?? 0) >
      getNewSubscriberNotificationCooldown(channel?.subscriberCount ?? 0)
    ) {
      await getMessaging().send({
        apns: {
          headers: {
            'apns-expiration': `${Math.floor(
              (Date.now() + MS_IN_HOUR * 24) / 1000,
            )}`,
          },
        },
        data: {
          url: `${WEB_URL}/${channelID}`,
        },
        notification: {
          title: 'New subscriber',
          body: `${channel?.title ?? 'One of your channels'} has a new subscriber`,
        },
        topic: getUserTopic(channelOwnerID),
        webpush: {
          fcmOptions: {
            link: `${WEB_URL}/${channelID}`,
          },
          headers: {
            ttl: `${(MS_IN_HOUR * 24) / 1000}`,
          },
        },
      })
    }
  } catch (error) {
    logger.error(
      'Failed to notify channel owner of new subscriber',
      error as Error,
    )
  }
}
