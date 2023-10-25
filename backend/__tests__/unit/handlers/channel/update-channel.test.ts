import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../../__mocks__/mock-event'
import { updateChannelHandler } from '../../../../src/handlers/channel/update-channel'
import { CORS_HEADERS } from '../../../../src/utils/constants'

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
    ddbMock.on(GetCommand).resolves({ Item: {} })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: '{"on": false,"note": "hello","title": "test channel"}',
      httpMethod: 'PUT',
      pathParameters: {
        channelID: 'someID',
      },
    }

    // Invoke updateChannelHandler()
    const result = await updateChannelHandler(event)

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

    // Invoke updateChannelHandler()
    const result = await updateChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)
    expect(resultBody.message).toEqual('Updated')
    // FIXME: Make this test meaningful... Can it spy on the ddbMock somehow?
    // expect(ddbMock).toHaveBeenCalledWith({})
  })
})
