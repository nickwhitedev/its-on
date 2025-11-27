import {
  BatchWriteCommand,
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
import { CORS_HEADERS } from '../../../../src/common/constants.js'
import unsubscribe from '../../../../src/handlers/channel/unsubscribe/unsubscribe.js'

// This includes all tests for unsubscribe()
describe('Test unsubscribe', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const silentLogger = new Logger({ logLevel: 'SILENT' })
  const metrics = new Metrics()
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes createChannelHandler() and compare the result
  it('should unsubscribe user from channel', async () => {
    const testChannel = {
      note: '',
      on: false,
      ownerID: 'nanouserid1',
      pk: 'channel#someID',
      sk: 'info',
      title: 'test-channel',
    }

    ddbMock.on(GetCommand).resolves({
      Item: testChannel,
    })
    ddbMock.on(BatchWriteCommand).resolves({})
    ddbMock.on(UpdateCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      pathParameters: {
        channelID: 'someID',
      },
    }

    // Invoke unsubscribe()
    const result = await unsubscribe(event, mockContext, silentLogger, metrics)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)

    expect(resultBody).toEqual({ message: 'Unsubscribed' })
  })
})
