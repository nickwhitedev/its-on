import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'
import { getOverviewHandler } from '../../../src/handlers/get-overview'
import { CORS_HEADERS } from '../../../src/utils/constants'

describe('Test getOverviewHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return items by item type', async () => {
    const items = [
      {
        on: false,
        note: '',
        sk: 'channel#someID',
        pk: 'user#userID',
        title: 'test-channel',
      },
      {
        on: true,
        note: 'test note',
        sk: 'subscription#someID2',
        pk: `user#userID2`,
        title: 'test-channel-2',
      },
      {
        sk: 'profile',
        pk: `user#userID`,
      },
    ]

    ddbMock.on(QueryCommand).resolves({
      Items: items,
    })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'GET',
    }

    const result = await getOverviewHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        channels: [
          {
            id: 'someID',
            on: false,
            note: '',
            title: 'test-channel',
          },
        ],
        subscriptions: [
          {
            id: 'someID2',
            on: true,
            note: 'test note',
            title: 'test-channel-2',
          },
        ],
        profile: {},
      }),
    }

    expect(result).toEqual(expectedResult)
  })
})
