import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockContext from '../../../../__mocks__/mock-context.js'
import mockEvent from '../../../../__mocks__/mock-event.js'
import { CORS_HEADERS } from '../../../../src/common/constants.mjs'
import { MS_IN_HOUR } from '../../../../src/common/time.mjs'
import createChannel from '../../../../src/handlers/channel/create-channel/create-channel.mjs'

// This includes all tests for createChannel()
describe('Test createChannel', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const silentLogger = new Logger({ logLevel: 'SILENT' })
  const metrics = new Metrics()
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

    // Invoke createChannel()
    const result = await createChannel(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

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

    // Invoke createChannel()
    const result = await createChannel(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

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

    // Invoke createChannel()
    const result = await createChannel(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

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

    // Invoke createChannel()
    const result = await createChannel(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(403)
    expect(resultBody.message).toEqual('Upgrade to create more channels')
  })
})
