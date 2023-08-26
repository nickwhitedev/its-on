import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { CORS_HEADERS } from '../../../src/utils/constants'
import { NIL as NIL_UUID } from 'uuid'
import { getOverviewHandler } from '../../../src/handlers/get-overview'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../__mocks__/mock-event'

describe('Test getOverviewHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return items by item type', async () => {
    const items = [
      {
        on: false,
        defaultNote: 'default note',
        compositeID: NIL_UUID,
        note: '',
        sk: `channel#${NIL_UUID}`,
        pk: `user#${NIL_UUID}`,
        title: 'test-channel',
      },
      {
        on: true,
        note: 'test note',
        sk: `subscription#${NIL_UUID}`,
        pk: `user#${NIL_UUID}`,
        title: 'test-channel-2',
      },
      {
        sk: 'profile',
        pk: `user#${NIL_UUID}`,
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
            id: NIL_UUID,
            on: false,
            defaultNote: 'default note',
            compositeID: NIL_UUID,
            note: '',
            title: 'test-channel',
          },
        ],
        subscriptions: [
          {
            id: NIL_UUID,
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
