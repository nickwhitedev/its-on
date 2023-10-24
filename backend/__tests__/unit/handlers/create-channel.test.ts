import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'
import { createChannelHandler } from '../../../src/handlers/channel/create-channel'
import { CORS_HEADERS } from '../../../src/utils/constants'
import { MS_IN_HOUR } from '../../../src/utils/time'

// This includes all tests for createChannelHandler()
describe('Test createChannelHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should add id to the table', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { tier: 5, username: 'test_user' } })
      .resolves({})
    ddbMock.on(PutCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: '{"title": "Super Channel"}',
      httpMethod: 'POST',
    }

    // Invoke createChannelHandler()
    const result = await createChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IChannel
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(201)

    expect(Object.keys(resultBody)).toEqual([
      'id',
      'subscribers',
      'capacity',
      'duration',
      'lastOn',
      'lastOnDuration',
      'lastUpdated',
      'note',
      'owner',
      'ownerID',
      'subscriberCount',
      'title',
    ])
    expect(resultBody.capacity).toEqual(5)
    expect(resultBody.duration).toEqual(MS_IN_HOUR)
    expect(resultBody.lastOn).toEqual(0)
    expect(resultBody.lastOnDuration).toEqual(MS_IN_HOUR)
    expect(resultBody.lastUpdated).toEqual(
      mockEvent.requestContext.requestTimeEpoch,
    )
    expect(resultBody.note).toEqual('')
    expect(resultBody.owner).toEqual('test_user')
    expect(resultBody.ownerID).toEqual('nanouserid1')
    expect(resultBody.subscriberCount).toEqual(0)
    expect(resultBody.subscribers).toEqual([])
    expect(resultBody.title).toEqual('Super Channel')
  })

  it('should trim long title', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { tier: 5, username: 'test_user' } })
      .resolves({})
    ddbMock.on(PutCommand).resolves({})

    const testLongTitle = 'Super Channel'.repeat(100)

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: `{"title": "${testLongTitle}"}`,
      httpMethod: 'POST',
    }

    // Invoke createChannelHandler()
    const result = await createChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IChannel
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(201)

    expect(Object.keys(resultBody)).toEqual([
      'id',
      'subscribers',
      'capacity',
      'duration',
      'lastOn',
      'lastOnDuration',
      'lastUpdated',
      'note',
      'owner',
      'ownerID',
      'subscriberCount',
      'title',
    ])
    expect(resultBody.capacity).toEqual(5)
    expect(resultBody.duration).toEqual(MS_IN_HOUR)
    expect(resultBody.lastOn).toEqual(0)
    expect(resultBody.lastOnDuration).toEqual(MS_IN_HOUR)
    expect(resultBody.lastUpdated).toEqual(
      mockEvent.requestContext.requestTimeEpoch,
    )
    expect(resultBody.note).toEqual('')
    expect(resultBody.owner).toEqual('test_user')
    expect(resultBody.ownerID).toEqual('nanouserid1')
    expect(resultBody.subscriberCount).toEqual(0)
    expect(resultBody.subscribers).toEqual([])
    expect(resultBody.title).toHaveLength(40)
    expect(resultBody.title).toEqual(testLongTitle.substring(0, 40))
  })

  it('should retry nanoid when there is an id collision', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { tier: 5, username: 'test_user' } })
      .resolvesOnce({ Item: { id: 'taken' } })
      .resolvesOnce({ Item: { id: 'taken' } })
      .resolves({})
    ddbMock.on(PutCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: '{"title": "Super Channel"}',
      httpMethod: 'POST',
    }

    // Invoke createChannelHandler()
    const result = await createChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IChannel
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(201)

    expect(Object.keys(resultBody)).toEqual([
      'id',
      'subscribers',
      'capacity',
      'duration',
      'lastOn',
      'lastOnDuration',
      'lastUpdated',
      'note',
      'owner',
      'ownerID',
      'subscriberCount',
      'title',
    ])
    expect(resultBody.capacity).toEqual(5)
    expect(resultBody.duration).toEqual(MS_IN_HOUR)
    expect(resultBody.lastOn).toEqual(0)
    expect(resultBody.lastOnDuration).toEqual(MS_IN_HOUR)
    expect(resultBody.lastUpdated).toEqual(
      mockEvent.requestContext.requestTimeEpoch,
    )
    expect(resultBody.note).toEqual('')
    expect(resultBody.owner).toEqual('test_user')
    expect(resultBody.ownerID).toEqual('nanouserid1')
    expect(resultBody.subscriberCount).toEqual(0)
    expect(resultBody.subscribers).toEqual([])
    expect(resultBody.title).toEqual('Super Channel')
  })

  it('should retry nanoid when there is an id collision', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock
      .on(GetCommand)
      .resolvesOnce({
        Item: { channelCount: 5, tier: 5, username: 'test_user' },
      })
      .resolvesOnce({ Item: { id: 'taken' } })
      .resolvesOnce({ Item: { id: 'taken' } })
      .resolves({})
    ddbMock.on(PutCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      body: '{"title": "Super Channel"}',
      httpMethod: 'POST',
    }

    // Invoke createChannelHandler()
    const result = await createChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(403)
    expect(resultBody.message).toEqual('Upgrade to create more channels')
  })
})
