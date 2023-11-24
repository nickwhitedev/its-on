import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'

import { DYNAMODB_TABLE_NAME } from './constants.mjs'
import { ChannelCopyTypeEnum } from './enums.mjs'
import wait from './wait.mjs'

interface GetUserInfoParams {
  ddbDocClient: DynamoDBDocumentClient
  userID: string
}

/**
 * Gets the logged in user's info.
 */
export const getUserInfo = async ({
  ddbDocClient,
  userID,
}: GetUserInfoParams): Promise<IDynamoUserItem | undefined> => {
  let ddbResponse
  try {
    ddbResponse = await ddbDocClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          pk: `user#${userID}`,
          sk: 'profile',
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
  return ddbResponse.Item as IDynamoUserItem | undefined
}

interface GetChannelParams {
  channelID: string
  ddbDocClient: DynamoDBDocumentClient
  userID?: string
  copyType?: ChannelCopyTypeEnum
}

/**
 * Gets a channel. If userID is given, the authoritative copy is returned
 */
export const getChannel = async ({
  channelID,
  ddbDocClient,
  userID,
  copyType,
}: GetChannelParams): Promise<IDynamoChannelItem | undefined> => {
  let ddbResponse
  try {
    ddbResponse = await ddbDocClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          pk:
            userID == null || copyType === ChannelCopyTypeEnum.PUBLIC
              ? `channel#${channelID}`
              : `user#${userID}`,
          sk:
            userID == null || copyType === ChannelCopyTypeEnum.PUBLIC
              ? 'info'
              : copyType === ChannelCopyTypeEnum.SUBSCRIBER
              ? `subscription#${channelID}`
              : `channel#${channelID}`,
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
