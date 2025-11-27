import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DYNAMODB_TABLE_NAME } from '../../../common/constants.js'
import { createResponse } from '../../../common/response.js'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Updates profile for the authenticated user
 */
const updateProfile = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  _metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'PUT') {
    throw new Error(
      `putMethod only accepts PUT method, you tried: ${event.httpMethod} method.`,
    )
  }

  const eventPath = event.path

  const userID = (event.requestContext.authorizer?.sub ?? '') as string
  const { username } = JSON.parse(event.body ?? '{}') as IUser

  // TODO: Use clerk webhook to keep username synced instead of this api endpoint
  try {
    const ddbResponse = await ddbDocClient.send(
      new UpdateCommand({
        Key: {
          pk: `user#${userID}`,
          sk: `profile`,
        },
        ReturnValues: 'ALL_NEW',
        TableName: DYNAMODB_TABLE_NAME,
        UpdateExpression: 'SET #username = :username',
        ExpressionAttributeNames: {
          '#username': 'username',
        },
        ExpressionAttributeValues: {
          ':username': username,
        },
      }),
    )
    logger.debug('Success - item updated', { ddbResponse })
    return createResponse({
      eventPath,
      responseBody: { message: 'Updated' },
      statusCode: 200,
    })
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Something went wrong' },
      statusCode: 400,
    })
  }
}

export default updateProfile
