import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import disableNotifications from './disable-notifications.mjs'

const logger = new Logger({ serviceName: 'itsOnDisableNotifications' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event, context) => disableNotifications(event, context, logger))
