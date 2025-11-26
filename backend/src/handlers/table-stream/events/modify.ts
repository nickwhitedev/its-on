import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBRecord } from 'aws-lambda'
import { handleChannelUpdated } from '../channel/channel-updated.js'
import { handleProfileUpdated } from '../user/profile-updated.js'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
  metrics: Metrics
}

export const handleModifyEvent = async ({
  record,
  ddbDocClient,
  logger,
  metrics,
}: Params) => {
  const [pk, sk] = [
    record.dynamodb?.Keys?.pk.S ?? '',
    record.dynamodb?.Keys?.sk.S ?? '',
  ]
  if (pk.startsWith('user') && sk.startsWith('channel')) {
    await handleChannelUpdated({ record, ddbDocClient, logger, metrics })
  } else if (pk.startsWith('user') && sk === 'profile') {
    await handleProfileUpdated({ record, ddbDocClient, logger })
  }
}
