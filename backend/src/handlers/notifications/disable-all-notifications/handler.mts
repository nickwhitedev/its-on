import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import disableAllNotifications from './disable-all-notifications.mjs'

const logger = new Logger({ serviceName: 'itsOnDisableNotifications' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event: APIGatewayProxyEvent, context: Context) =>
    disableAllNotifications(event, context, logger),
  )
