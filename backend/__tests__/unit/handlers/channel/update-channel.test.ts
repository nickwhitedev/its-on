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
import updateChannel from '../../../../src/handlers/channel/update-channel/update-channel.mjs'

// This includes all tests for updateChannel()
describe('Test updateChannel', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const silentLogger = new Logger({ logLevel: 'SILENT' })
  const metrics = new Metrics()
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes updateChannel() and compare the result
  it('should add id to the table', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock.on(UpdateCommand).resolves({})
    ddbMock.on(GetCommand).resolves({ Item: {} })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: '{"on": false,"note": "hello","title": "test channel"}',
      httpMethod: 'PUT',
      pathParameters: {
        channelID: 'someID',
      },
    }

    // Invoke updateChannel()
    const result = await updateChannel(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)
    expect(resultBody.message).toEqual('Updated')
  })

  it('should trim note and title', async () => {
    ddbMock.on(UpdateCommand).resolves({})
    ddbMock.on(GetCommand).resolves({ Item: {} })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: `{"on": false,"note": "${'hello'.repeat(
        100,
      )}","title": "${'test channel'.repeat(100)}"}`,
      httpMethod: 'PUT',
      pathParameters: {
        channelID: 'someID',
      },
    }

    // Invoke updateChannel()
    const result = await updateChannel(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)
    expect(resultBody.message).toEqual('Updated')
    // FIXME: Make this test meaningful... Can it spy on the ddbMock somehow?
    // expect(ddbMock).toHaveBeenCalledWith({})
  })
})
