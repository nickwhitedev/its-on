import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnits, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { Webhook } from 'svix'
import { DYNAMODB_TABLE_NAME } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Handles a log from the front-end
 */
const authWebhook = async (
  event: APIGatewayProxyEvent,
  _context: Context,
  logger: Logger,
  metrics: Metrics,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    )
  }
  const eventPath = event.path

  // Check if the 'Signing Secret' from the Clerk Dashboard was correctly provided
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    throw new Error('You need a WEBHOOK_SECRET in your ')
  }

  // Grab the headers and body
  const headers = event.headers
  const payload = event.body ?? ''

  // Get the Svix headers for verification
  const svix_id = headers['svix-id']
  const svix_timestamp = headers['svix-timestamp']
  const svix_signature = headers['svix-signature']

  // If there are missing Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    const message = 'Webhook verification failed - Missing Svix headers'
    logger.error(message)
    return createResponse({
      eventPath,
      responseBody: { message },
      statusCode: 400,
    })
  }

  // Initiate Svix
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If the verification fails, error out and  return error code
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (error) {
    logger.error('Error', error as Error)
    return createResponse({
      eventPath,
      responseBody: { message: 'Webhook verification failed' },
      statusCode: 400,
    })
  }

  const eventType = evt.type

  if (eventType === 'user.deleted') {
    const { id, deleted } = evt.data
    if (deleted) {
      try {
        const ddbResponse = await ddbDocClient.send(
          new DeleteCommand({
            Key: {
              pk: `user#${id}`,
              sk: `profile`,
            },
            TableName: DYNAMODB_TABLE_NAME,
          }),
        )
        logger.debug('Success - user deleted', { ddbResponse })
        metrics.addMetric('userDelete', MetricUnits.Count, 1)
      } catch (error) {
        logger.error('Error', error as Error)
        return createResponse({
          eventPath,
          responseBody: { message: 'User deletion failed' },
          statusCode: 400,
        })
      }
    }
  }

  return new Promise(resolve => {
    resolve(
      createResponse({
        eventPath,
        responseBody: {
          message: 'Webhook received',
        },
        statusCode: 200,
      }),
    )
  })
}

export default authWebhook
