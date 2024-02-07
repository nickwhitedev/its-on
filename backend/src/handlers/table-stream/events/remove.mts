import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { handleChannelDeleted } from '../channel/channel-deleted.mjs'
import { handleUserDeleted } from '../user/user-deleted.mjs'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleRemoveEvent = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const [pk, sk] = [
    record.dynamodb?.Keys?.pk?.S ?? '',
    record.dynamodb?.Keys?.sk?.S ?? '',
  ]
  if (pk.startsWith('user') && sk.startsWith('channel')) {
    await handleChannelDeleted({ record, ddbDocClient, logger })
  } else if (pk.startsWith('user') && sk === 'profile') {
    await handleUserDeleted({ record, ddbDocClient, logger })
  }
}
