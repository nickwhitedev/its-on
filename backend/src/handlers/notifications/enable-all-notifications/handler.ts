import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import enableAllNotifications from './enable-all-notifications.js'

const logger = new Logger({ serviceName: 'itsOnEnableNotifications' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event: APIGatewayProxyEvent, context: Context) =>
    enableAllNotifications(event, context, logger),
  )
