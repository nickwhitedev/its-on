import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBRecord } from 'aws-lambda'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { getUserInfo } from '/opt/nodejs/dynamo.mjs'

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
  const subscriptionPK = record.dynamodb?.Keys?.pk?.S ?? ''

  const userID = subscriptionPK.substring(subscriptionPK.indexOf('#') + 1)

  // Reduce user's subscription count (if user still exists)
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
          UpdateExpression: 'ADD #subscriptionCount :subscriptionCount',
          ExpressionAttributeNames: {
            '#subscriptionCount': 'subscriptionCount',
          },
          ExpressionAttributeValues: {
            ':subscriptionCount': -1,
          },
        }),
      )
      logger.debug('Success - subscription count updated', { ddbResponse })
    } catch (error) {
      logger.error('Subscription count decrement error', error as Error)
    }
  }
}
