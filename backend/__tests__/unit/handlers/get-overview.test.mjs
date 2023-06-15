import { getOverviewHandler } from '../../../src/handlers/get-overview.mjs'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { testRequestContext } from '../../util/constants.mjs'
import { NIL as NIL_UUID } from 'uuid'

// This includes all tests for getOverviewHandler()
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

    // Return the specified value whenever the spied scan function is called
    ddbMock.on(QueryCommand).resolves({
      Items: items,
    })

    const event = {
      httpMethod: 'GET',
      requestContext: testRequestContext,
    }

    // Invoke helloFromLambdaHandler()
    const result = await getOverviewHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        channels: [
          {
            on: false,
            defaultNote: 'default note',
            compositeID: NIL_UUID,
            note: '',
            sk: `channel#${NIL_UUID}`,
            pk: `user#${NIL_UUID}`,
            title: 'test-channel',
          },
        ],
        subscriptions: [
          {
            on: true,
            note: 'test note',
            sk: `subscription#${NIL_UUID}`,
            pk: `user#${NIL_UUID}`,
            title: 'test-channel-2',
          },
        ],
        profile: {
          sk: 'profile',
          pk: `user#${NIL_UUID}`,
        },
      }),
    }

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult)
  })
})
