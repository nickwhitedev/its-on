import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { v1 as uuid } from 'uuid'
import { CORS_HEADERS } from '../utils/constants.mjs'
const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

// Get the DynamoDB table name from environment variables
const tableName = process.env.ITS_ON_TABLE

/**
 * Creates a channel for the authenticated user
 */
export const createChannelHandler = async event => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  // All log statements are written to CloudWatch
  console.info('received:', event)

  const { defaultNote, title } = JSON.parse(event.body)
  const userID = event.requestContext.authorizer.claims.sub
  const channelID = uuid()

  const channelAttributes = {
    defaultNote,
    note: '',
    on: false,
    title,
  }

  const params = {
    RequestItems: {
      [tableName]: [
        {
          PutRequest: {
            Item: {
              pk: `user#${userID}`,
              sk: `channel#${channelID}`,
              ...channelAttributes,
            },
          },
        },
        {
          PutRequest: {
            Item: {
              pk: `channel#${userID}#${channelID}`,
              sk: 'info',
              ...channelAttributes,
            },
          },
        },
      ],
    },
  }

  let statusCode
  let responseBody

  try {
    const ddbResponse = await ddbDocClient.send(new BatchWriteCommand(params))
    statusCode = 201
    responseBody = {
      id: channelID,
      ...channelAttributes,
    }
    console.info('Success - item added or updated', ddbResponse)
  } catch (err) {
    statusCode = 400
    console.error('Error', err.stack)
    responseBody = { message: 'Something went wrong' }
  }

  const response = {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  }

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path}: `, {
    statusCode: response.statusCode,
    body: responseBody,
  })

  return response
}
