import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../../__mocks__/mock-event'
import { CORS_HEADERS } from '../../../../src/common/constants'
import { removeChannelSubscriberHandler } from '../../../../src/handlers/channel/remove-channel-subscriber'

describe('Test removeChannelSubscriberHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should unsubscribe user from channel', async () => {
    ddbMock.on(BatchWriteCommand).resolves({})
    ddbMock.on(GetCommand).resolves({})
    ddbMock.on(UpdateCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'DELETE',
      pathParameters: {
        channelID: 'someID',
        subscriberID: 'subscriber-id',
      },
    }

    const result = await removeChannelSubscriberHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(204)

    expect(resultBody).toEqual({ message: 'Subscriber removed' })
  })
})
