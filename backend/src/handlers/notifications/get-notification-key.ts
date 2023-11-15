import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { ENV, PUSH_NOTIFICATION_PUBLIC_KEY } from '/opt/nodejs/constants'
import { createResponse } from '/opt/nodejs/response'

/**
 * Handler for getting the VAPID public key used for notification encryption
 */
export const getNotificationKeyHandler = (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accepts GET method, you tried: ${event.httpMethod} method.`,
    )
  }
  if (ENV !== 'prod') {
    console.debug('received:', event)
  }

  return new Promise(resolve => {
    resolve(
      createResponse({
        eventPath: event.path,
        responseBody: { publicKey: PUSH_NOTIFICATION_PUBLIC_KEY },
        statusCode: 200,
      }),
    )
  })
}
