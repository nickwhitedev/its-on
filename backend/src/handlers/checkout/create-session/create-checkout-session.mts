import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
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
import Stripe from 'stripe'
import { createResponse } from '/opt/nodejs/response.mjs'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

interface IPayload {
  title: string
}

/**
 * Creates a stripe checkout session for the authenticated user
 */
const createCheckoutSession = async (
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
    throw new Error('Stripe API secret key not found')
  }

  const stripe = new Stripe(stripeSecretKey)

  const prices = await stripe.prices.list()

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: prices.data.map(priceData => ({
      price: priceData.id,
      quantity: 1,
    })),
    mode: 'payment',
    return_url: `${process.env.WEB_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
  })

  metrics.addMetric('checkoutSessionCreated', MetricUnit.Count, 1)

  return createResponse({
    eventPath,
    responseBody: { clientSecret: session.client_secret },
    statusCode: 201,
  })
}

export default createCheckoutSession
