import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { CORS_HEADERS } from '../../../src/utils/constants'
import { getChannelHandler } from '../../../src/handlers/get-channel'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'

describe('Test getChannelHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should get public channel data', async () => {
    const item = {
      note: '',
      on: false,
      pk: 'channel#someID',
      sk: 'info',
      title: 'test-channel',
    }

    ddbMock.on(GetCommand).resolvesOnce({}).resolvesOnce({
      Item: item,
    })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      pathParameters: {
        channelID: 'someID',
      },
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        id: 'someID',
        note: '',
        on: false,
        title: 'test-channel',
      }),
    }

    expect(result).toEqual(expectedResult)
  })

  it('should get all channel data as owner by id', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        note: '',
        on: false,
        pk: 'user#userID',
        sk: 'channel#someID',
        title: 'test-channel',
      },
    })

    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          note: '',
          on: false,
          owner: 'supercoolguy',
          pk: 'channel#someID',
          sk: 'info',
          title: 'test-channel',
        },
        {
          pk: `channel#someID`,
          sk: `subscriber#userID`,
          username: 'bestie',
        },
      ],
    })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      pathParameters: {
        channelID: 'someID',
      },
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        id: 'someID',
        note: '',
        on: false,
        title: 'test-channel',
        subscribers: [
          {
            id: 'userID',
            username: 'bestie',
          },
        ],
      }),
    }

    expect(result).toEqual(expectedResult)
  })

  it('should 404 when empty ddb response', async () => {
    ddbMock.on(GetCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      pathParameters: {
        channelID: 'someID',
      },
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Channel not found' }),
    }

    expect(result).toEqual(expectedResult)
  })
})
