import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CORS_HEADERS } from '../utils/constants.mjs';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.ITS_ON_TABLE;

/**
 * Creates a channel for the authenticated user
 */
export const createChannelHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { defaultNote, title } = JSON.parse(event.body);
  const userID = event.requestContext.authorizer.claims.sub;

  const channelAttributes = {
    defaultNote,
    on: false,
    note: '',
    title,
  };

  const params = {
    RequestItems: {
      [tableName]: [
        {
          PutRequest: {
            Item: {
              pk: `USER#${userID}`,
              sk: `CHANNEL#${title}`,
              ...channelAttributes,
            },
          },
        },
        {
          PutRequest: {
            Item: {
              pk: `USER#${userID}#CHANNEL#${title}`,
              sk: `USER#${userID}#CHANNEL#${title}`,
              ...channelAttributes
            },
          },
        }
      ],
    },
  };

  let statusCode;
  let data;

  try {
    data = await ddbDocClient.send(new BatchWriteCommand(params));
    statusCode = 200;
    console.log('Success - item added or updated', data);
  } catch (err) {
    statusCode = 400;
    console.log('Error', err.stack);
  }

  const response = {
    statusCode,
    headers: CORS_HEADERS,
  };

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} data: ${data}`);
  return response;
};
