import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { NIL as NIL_UUID } from 'uuid'
import { getChannelHandler } from '../../../src/handlers/get-channel.mjs'
import { mockClient } from 'aws-sdk-client-mock'
import { testRequestContext } from '../../util/constants.mjs'

describe('Test getByIdHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should get channel data by id', async () => {
    const items = [
      {
        defaultNote: 'default note',
        id: NIL_UUID,
        note: '',
        on: false,
        pk: `channel#${NIL_UUID}`,
        sk: `info`,
        title: 'test-channel',
      },
      {
        pk: `channel#${NIL_UUID}`,
        sk: `subscriber#${NIL_UUID}`,
        username: 'bestie',
      },
    ]

    ddbMock.on(QueryCommand).resolves({
      Items: items,
    })

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        channelID: NIL_UUID,
      },
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        info: {
          defaultNote: 'default note',
          id: NIL_UUID,
          note: '',
          on: false,
          pk: `channel#${NIL_UUID}`,
          sk: `info`,
          title: 'test-channel',
        },
        subscribers: [
          {
            pk: `channel#${NIL_UUID}`,
            sk: `subscriber#${NIL_UUID}`,
            username: 'bestie',
          },
        ],
      }),
    }

    expect(result).toEqual(expectedResult)
  })
})
