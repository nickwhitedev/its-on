import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { PUSH_NOTIFICATION_PUBLIC_KEY } from '../utils/constants'
import { createResponse } from '../utils/response'

/**
 * Handler for getting the VAPID public key used for notification encryption
 */
export const getNotificationKeyHandler = (
  event: APIGatewayProxyEvent,
): APIGatewayProxyResult => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accepts GET method, you tried: ${event.httpMethod} method.`,
    )
  }
  console.debug('received:', event)

  return createResponse({
    eventPath: event.path,
    responseBody: { publicKey: PUSH_NOTIFICATION_PUBLIC_KEY },
    statusCode: 200,
  })
}
