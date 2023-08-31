import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'
import { unsubscribeHandler } from '../../../src/handlers/unsubscribe'
import { CORS_HEADERS } from '../../../src/utils/constants'

// This includes all tests for unsubscribeHandler()
describe('Test unsubscribeHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
  
  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes createChannelHandler() and compare the result
  it('should add id to the table', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock.on(BatchWriteCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      pathParameters: {
        channelID: 'someID',
      },
    }

    // Invoke unsubscribeHandler()
    const result = await unsubscribeHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)

    expect(resultBody).toEqual({ message: 'Unsubscribed' })
  })
})
