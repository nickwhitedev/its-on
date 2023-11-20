import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../../__mocks__/mock-event.js'
import { CORS_HEADERS } from '../../../../src/common/constants.js'
import { subscribeHandler } from '../../../../src/handlers/channel/subscribe.js'

// This includes all tests for subscribeHandler()
describe('Test subscribeHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should subscribe user to channel', async () => {
    const testChannel = {
      capacity: 5,
      note: '',
      on: false,
      ownerID: 'nanouserid1',
      pk: 'channel#someID',
      sk: 'info',
      subscriberCount: 0,
      title: 'test-channel',
    }

    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { subscriptionCount: 0, tier: 5 } })
      .resolvesOnce({})
      .resolvesOnce({
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

    // Invoke subscribeHandler()
    const result = await subscribeHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)

    expect(resultBody).toEqual({ message: 'Subscribed' })
  })

  it('should return 403 when channel is full', async () => {
    const testChannel = {
      capacity: 5,
      note: '',
      on: false,
      ownerID: 'nanouserid1',
      pk: 'channel#someID',
      sk: 'info',
      subscriberCount: 5,
      title: 'test-channel',
    }

    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { subscriptionCount: 0, tier: 5 } })
      .resolvesOnce({})
      .resolvesOnce({
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

    // Invoke subscribeHandler()
    const result = await subscribeHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(403)

    expect(resultBody).toEqual({ message: 'Channel is full' })
  })

  it('should return 403 when user has the maximum number subscriptions', async () => {
    const testChannel = {
      capacity: 5,
      note: '',
      on: false,
      ownerID: 'nanouserid1',
      pk: 'channel#someID',
      sk: 'info',
      subscriberCount: 0,
      title: 'test-channel',
    }

    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { subscriptionCount: 5, tier: 5 } })
      .resolvesOnce({})
      .resolvesOnce({
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

    // Invoke subscribeHandler()
    const result = await subscribeHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(403)

    expect(resultBody).toEqual({
      message: 'Upgrade to subscribe to more channels',
    })
  })
})
