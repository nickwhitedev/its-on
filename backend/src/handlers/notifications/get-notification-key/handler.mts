import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import getNotificationKey from './get-notification-key.mjs'

const logger = new Logger({ serviceName: 'itsOnDisableNotifications' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event, context) => getNotificationKey(event, context))
