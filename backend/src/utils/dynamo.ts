import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'

import { DYNAMODB_TABLE_NAME } from './constants'
import wait from './wait'

interface GetChannelParams {
  channelID: string
  ddbDocClient: DynamoDBDocumentClient
  userID?: string
}

/**
 * Gets a channel. If userID is given, the authoritative copy is returned
 */
export const getChannel = async ({
  channelID,
  ddbDocClient,
  userID,
}: GetChannelParams): Promise<IDynamoChannelItem | undefined> => {
  let ddbResponse
  try {
    ddbResponse = await ddbDocClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          pk: userID == null ? `channel#${channelID}` : `user#${userID}`,
          sk: userID == null ? 'info' : `channel#${channelID}`,
        },
      }),
    )
  } catch (error) {
    console.error(
      'Dynamo get error',
      error instanceof Error ? error.stack : 'Unknown Type',
    )
    throw new Error(
      'Dynamo Get Error',
      error instanceof Error ? error : undefined,
    )
  }
  return ddbResponse.Item as IDynamoChannelItem | undefined
}

interface BatchWriteParams {
  batchWriteInput: BatchWriteCommandInput
  ddbDocClient: DynamoDBDocumentClient
  retryCount?: number
}

export const batchWrite = async ({
  batchWriteInput,
  ddbDocClient,
  retryCount = 0,
}: BatchWriteParams): Promise<BatchWriteCommandOutput> => {
  const response = await ddbDocClient.send(
    new BatchWriteCommand(batchWriteInput),
  )

  if (
    response.UnprocessedItems &&
    Object.keys(response.UnprocessedItems).length > 0
  ) {
    if (retryCount > 8) {
      throw new Error('Unprocessed Items not processed')
    }
    await wait(2 ** retryCount * 10)

    return await batchWrite({
      batchWriteInput: { RequestItems: response.UnprocessedItems },
      ddbDocClient,
      retryCount: retryCount + 1,
    })
  }

  return response
}
