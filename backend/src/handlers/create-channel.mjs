import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { CORS_HEADERS, DYNAMODB_TABLE_NAME } from '../utils/constants.mjs'
import { v1 as uuidv1, v5 as uuidv5 } from 'uuid'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Creates a channel for the authenticated user
 */
export const createChannelHandler = async event => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.info('received:', event)

  const { defaultNote, title } = JSON.parse(event.body)
  const userID = event.requestContext.authorizer.claims.sub
  const channelID = uuidv1()
  const compositeID = uuidv5(userID, channelID)

  const channelAttributes = {
    defaultNote,
    note: '',
    on: false,
    title,
  }

  const params = {
    RequestItems: {
      [DYNAMODB_TABLE_NAME]: [
        {
          PutRequest: {
            Item: {
              pk: `user#${userID}`,
              sk: `channel#${channelID}`,
              compositeID,
              ...channelAttributes,
            },
          },
        },
        {
          PutRequest: {
            Item: {
              pk: `channel#${compositeID}`,
              sk: 'info',
              note: '',
              on: false,
              owner: event.requestContext.authorizer.claims['cognito:username'],
              title,
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
      compositeID,
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

  console.info(`response from: ${event.path}: `, {
    statusCode: response.statusCode,
    body: responseBody,
  })

  return response
}
