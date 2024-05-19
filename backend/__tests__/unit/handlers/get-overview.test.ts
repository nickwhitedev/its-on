import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { CORS_HEADERS } from '../../../src/common/constants.mjs'
import { Logger } from '@aws-lambda-powertools/logger'
import getOverview from '../../../src/handlers/get-overview/get-overview.mjs'
import { mockClient } from 'aws-sdk-client-mock'
import mockContext from '../../../__mocks__/mock-context.js'
import mockEvent from '../../../__mocks__/mock-event.js'

describe('Test getOverviewHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const silentLogger = new Logger({ logLevel: 'SILENT' })

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
        channelCount: 3,
        sk: 'profile',
        pk: `user#userID`,
        subscriptionCount: 2,
        tier: 10,
        username: 'testie',
      },
    ]

    ddbMock.on(QueryCommand).resolves({
      Items: items,
    })

    ddbMock.on(PutCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'GET',
    }
    const result = await getOverview(event, mockContext, silentLogger)

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
        profile: {
          channelCount: 3,
          subscriptionCount: 2,
          tier: 10,
          username: 'testie',
          notificationTokens: {},
          subscriptionTopics: ['user-_channel-someID2'],
        },
      }),
    }

    expect(result).toEqual(expectedResult)
  })

  it("should create the profile item if it doesn't exist", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [],
    })

    ddbMock.on(PutCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'GET',
    }

    const result = await getOverview(event, mockContext, silentLogger)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        profile: {
          id: 'nanouserid1',
          channelCount: 0,
          lastNewSubscriberNotification: 0,
          notificationsEnabled: true,
          notificationTokens: {},
          subscriptionCount: 0,
          tier: 5,
          username: 'test_user',
        },
      }),
    }

    expect(result).toEqual(expectedResult)
  })
})
