import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import { NIL as NIL_UUID, v1 as uuidv1, v5 as uuidv5 } from 'uuid'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { CORS_HEADERS } from '../../../src/utils/constants'
import { jest } from '@jest/globals'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'
import { subscribeHandler } from '../../../src/handlers/subscribe'

// This includes all tests for subscribeHandler()
describe('Test subscribeHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  const testUuidv1 = uuidv1()
  const testUuidv5 = uuidv5(NIL_UUID, testUuidv1)

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes createChannelHandler() and compare the result
  it('should add id to the table', async () => {
    const testChannel = {
      note: '',
      on: false,
      pk: `channel#${testUuidv5}`,
      sk: `info`,
      title: 'test-channel',
    }

    ddbMock.on(GetCommand).resolves({
      Item: testChannel,
    })

    // Return the specified value whenever the spied put function is called
    ddbMock.on(BatchWriteCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      pathParameters: {
        channelID: testUuidv5,
      },
    }

    // Invoke subscribeHandler()
    const result = await subscribeHandler(event)

    const resultBody = JSON.parse(result.body)
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)

    expect(resultBody).toEqual({ message: 'Subscribed' })
  })
})
