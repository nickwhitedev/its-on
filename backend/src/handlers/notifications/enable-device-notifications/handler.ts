import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import enableDeviceNotifications from './enable-device-notifications.js'

const logger = new Logger({ serviceName: 'itsOnSubscribeNotifications' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event: APIGatewayProxyEvent, context: Context) =>
    enableDeviceNotifications(event, context, logger),
  )
