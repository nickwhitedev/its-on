import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { CORS_HEADERS } from '../../../src/utils/constants'
import { jest } from '@jest/globals'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'
import { updateChannelHandler } from '../../../src/handlers/update-channel'

// This includes all tests for updateChannelHandler()
describe('Test updateChannelHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes updateChannelHandler() and compare the result
  it('should add id to the table', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock.on(UpdateCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: '{"id": "00000000-0000-0000-0000-000000000000","on": false,"note": "hello"}',
      httpMethod: 'PUT',
    }

    // Invoke updateChannelHandler()
    const result = await updateChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)
    expect(resultBody.message).toEqual('Updated')
  })
})
