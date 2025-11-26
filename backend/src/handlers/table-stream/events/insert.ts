import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { handleChannelAdded } from '../channel/channel-added.js'
import { handleChannelSubscriberAdded } from '../channel/subscriber-added.js'
import { handleSubscriptionAdded } from '../user/subscription-added.js'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleInsertEvent = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const [pk, sk] = [
    record.dynamodb?.Keys?.pk.S ?? '',
    record.dynamodb?.Keys?.sk.S ?? '',
  ]
  if (pk.startsWith('user') && sk.startsWith('channel')) {
    await handleChannelAdded({ record, ddbDocClient, logger })
  } else if (pk.startsWith('user') && sk.startsWith('subscription')) {
    await handleSubscriptionAdded({ record, ddbDocClient, logger })
  } else if (pk.startsWith('channel') && sk.startsWith('subscriber')) {
    await handleChannelSubscriberAdded({ record, ddbDocClient, logger })
  }
}
