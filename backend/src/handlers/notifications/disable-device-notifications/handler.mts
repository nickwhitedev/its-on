import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import disableDeviceNotifications from './disable-device-notifications.mjs'

const logger = new Logger({ serviceName: 'itsOnUnsubscribeNotifications' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event: APIGatewayProxyEvent, context: Context) =>
    disableDeviceNotifications(event, context, logger),
  )
