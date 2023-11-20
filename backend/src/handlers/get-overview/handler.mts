import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'
import middy from '@middy/core'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import getOverview from './get-overview.mjs'

const logger = new Logger({ serviceName: 'itsOnOverview' })

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(injectLambdaContext(logger))
  .handler((event, context) => getOverview(event, context, logger))
