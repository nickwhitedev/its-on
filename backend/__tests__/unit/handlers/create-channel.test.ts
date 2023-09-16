import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { CORS_HEADERS } from '../../../src/utils/constants'
import { createChannelHandler } from '../../../src/handlers/create-channel'
import { jest } from '@jest/globals'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'

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
    ddbMock.on(GetCommand).resolves({})
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
      'note',
      'on',
      'owner',
      'title',
    ])
    expect(resultBody.note).toEqual('')
    expect(resultBody.on).toEqual(false)
    expect(resultBody.owner).toEqual('test_user')
    expect(resultBody.subscribers).toEqual([])
    expect(resultBody.title).toEqual('Super Channel')
  })

  it('should trim long title', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock.on(GetCommand).resolves({})
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
      'note',
      'on',
      'owner',
      'title',
    ])
    expect(resultBody.note).toEqual('')
    expect(resultBody.on).toEqual(false)
    expect(resultBody.owner).toEqual('test_user')
    expect(resultBody.subscribers).toEqual([])
    expect(resultBody.title).toHaveLength(40)
    expect(resultBody.title).toEqual(testLongTitle.substring(0, 40))
  })

  it('should retry nanoid when there is an id collision', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock
      .on(GetCommand)
      .resolvesOnce({ Item: { id: 'taken' } })
      .resolvesOnce({ Item: { id: 'taken' } })
      .resolvesOnce({})
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
      'note',
      'on',
      'owner',
      'title',
    ])
    expect(resultBody.note).toEqual('')
    expect(resultBody.on).toEqual(false)
    expect(resultBody.owner).toEqual('test_user')
    expect(resultBody.subscribers).toEqual([])
    expect(resultBody.title).toEqual('Super Channel')
  })
})
