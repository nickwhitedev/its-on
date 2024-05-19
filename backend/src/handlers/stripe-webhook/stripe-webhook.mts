import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { Logger } from '@aws-lambda-powertools/logger'
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import {
  DYNAMODB_TABLE_NAME,
  SKUS_TO_TIERS,
  UNLIMITED_SUBSCRIPTION_SKU,
} from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'
import Stripe from 'stripe'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

/**
 * Handles events from stripe
 */
const stripeWebhook = async (
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

  const stripeSecret = await new SecretsManagerClient({
    region: 'us-east-1',
  }).send(
    new GetSecretValueCommand({
      SecretId: process.env.STRIPE_API_SECRET_KEY_NAME,
    }),
  )

  const stripeSecretKey = stripeSecret.SecretString ?? ''

  if (!stripeSecretKey) {
    throw new Error('Stripe secret not found')
  }

  const stripeWebhookEndpointSecret = await new SecretsManagerClient({
    region: 'us-east-1',
  }).send(
    new GetSecretValueCommand({
      SecretId: process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET_KEY_NAME,
    }),
  )

  const stripeWebhookEndpointSecretKey =
    stripeWebhookEndpointSecret.SecretString ?? ''

  if (!stripeWebhookEndpointSecretKey) {
    throw new Error('Stripe webhook endpoint secret not found')
  }

  const stripe = new Stripe(stripeSecretKey)

  // Grab the headers and body
  const headers = event.headers
  const payload = event.body ?? ''

  const signature = headers['Stripe-Signature'] ?? ''

  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookEndpointSecretKey,
    )
  } catch (error) {
    const message = `Webhook Error: ${(error as Error).message}`
    logger.error(message, error as Error)
    return createResponse({
      eventPath,
      responseBody: { error: error as Error, message },
      statusCode: 400,
    })
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const paymentIntent = stripeEvent.data.object
      const userID = paymentIntent.client_reference_id
      if (userID == null) {
        logger.error(
          'Stripe Webhook checkout.session.completed Error: client_reference_id not given',
        )
        break
      }
      // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        paymentIntent.id,
        {
          expand: ['line_items'],
        },
      )
      logger.debug('sessionWithLineItems', { sessionWithLineItems })
      const lineItems = sessionWithLineItems.line_items
      if (lineItems == null || lineItems.data.length === 0) {
        logger.error(
          'Stripe Webhook checkout.session.completed Error: No line items given',
        )
        break
      }

      try {
        let newTier = 5
        let isSubscription = false as boolean
        lineItems.data.forEach(lineItem => {
          const sku = lineItem.price?.metadata.sku ?? ''
          if (sku === UNLIMITED_SUBSCRIPTION_SKU) {
            isSubscription = true
          } else if (Object.keys(SKUS_TO_TIERS).includes(sku)) {
            newTier = Math.max(
              newTier,
              SKUS_TO_TIERS[sku as keyof typeof SKUS_TO_TIERS],
            )
          } else {
            logger.error(
              'Stripe Webhook checkout.session.completed Error: sku not recognized',
              { sku },
            )
            throw new Error('sku not recognized')
          }
        })
        const ddbResponse = await ddbDocClient.send(
          new UpdateCommand({
            Key: {
              pk: `user#${userID}`,
              sk: `profile`,
            },
            ReturnValues: 'ALL_NEW',
            TableName: DYNAMODB_TABLE_NAME,
            UpdateExpression: 'SET #tier = :tier',
            ExpressionAttributeNames: {
              '#tier': isSubscription ? 'unlimited' : 'tier',
            },
            ExpressionAttributeValues: {
              ':tier': isSubscription ? true : newTier,
            },
          }),
        )
        metrics.addMetric('successfulPurchase', MetricUnit.Count, 1)
        logger.debug('Success - payment processed for user', { ddbResponse })
      } catch (error) {
        logger.error('Payment processing error', error as Error)
        break
      }
      logger.info('PaymentIntent was successful!')
      break
    }
    default:
      logger.warn(`Unhandled stripeEvent type ${stripeEvent.type}`)
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

export default stripeWebhook
