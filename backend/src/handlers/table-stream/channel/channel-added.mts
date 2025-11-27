import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.mjs'
import { getUserInfo } from '../../../common/dynamo.mjs'

interface Params {
  record: DynamoDBRecord
  ddbDocClient: DynamoDBDocumentClient
  logger: Logger
}

export const handleChannelAdded = async ({
  record,
  ddbDocClient,
  logger,
}: Params) => {
  const channelPK = record.dynamodb?.Keys?.pk.S ?? ''

  const userID = channelPK.substring(channelPK.indexOf('#') + 1)

  // Reduce user's channel count (if user still exists)
  if ((await getUserInfo({ ddbDocClient, userID })) != null) {
    try {
      const ddbResponse = await ddbDocClient.send(
        new UpdateCommand({
          Key: {
            pk: `user#${userID}`,
            sk: `profile`,
          },
          ReturnValues: 'ALL_NEW',
          TableName: DYNAMODB_TABLE_NAME,
          UpdateExpression: 'ADD #channelCount :channelCount',
          ExpressionAttributeNames: {
            '#channelCount': 'channelCount',
          },
          ExpressionAttributeValues: {
            ':channelCount': 1,
          },
        }),
      )
      logger.debug('Success - channel count updated', { ddbResponse })
    } catch (error) {
      logger.error('Channel count increment error', error as Error)
    }
  }
}
