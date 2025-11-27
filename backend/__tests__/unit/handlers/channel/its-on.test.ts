import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockContext from '../../../../__mocks__/mock-context.js'
import mockEvent from '../../../../__mocks__/mock-event.js'
import { CORS_HEADERS } from '../../../../src/common/constants.mjs'
import itsOn from '../../../../src/handlers/channel/its-on/its-on.mjs'

describe('Test itsOnHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const silentLogger = new Logger({ logLevel: 'SILENT' })
  const metrics = new Metrics()
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return Its On', async () => {
    ddbMock.on(UpdateCommand).resolves({})
    ddbMock.on(GetCommand).resolves({ Item: {} })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      pathParameters: {
        channelID: 'someID',
      },
    }

    const result = await itsOn(event, mockContext, silentLogger, metrics)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage

    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)
    expect(resultBody.message).toEqual("It's On!")
  })
})
