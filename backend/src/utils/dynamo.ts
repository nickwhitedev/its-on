import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { DYNAMODB_TABLE_NAME } from './constants'

interface Params {
  channelID: string
  ddbDocClient: DynamoDBDocumentClient
  userID?: string
}

export const getChannel = async ({
  channelID,
  ddbDocClient,
  userID,
}: Params): Promise<IDynamoChannelItem | undefined> => {
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
