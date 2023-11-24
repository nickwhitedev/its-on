import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { PUSH_NOTIFICATION_PUBLIC_KEY } from '/opt/nodejs/constants.mjs'
import { createResponse } from '/opt/nodejs/response.mjs'

/**
 * Handler for getting the VAPID public key used for notification encryption
 */
const getNotificationKey = (
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getMethod only accepts GET method, you tried: ${event.httpMethod} method.`,
    )
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

export default getNotificationKey
