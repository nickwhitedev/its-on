import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { NIL as NIL_UUID, v1 as uuidv1, v5 as uuidv5 } from 'uuid'

import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { getChannelHandler } from '../../../src/handlers/get-channel.mjs'
import { mockClient } from 'aws-sdk-client-mock'
import { testRequestContext } from '../../util/constants.mjs'

describe('Test getChannelHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  const testUuidv1 = uuidv1()
  const testUuidv5 = uuidv5(NIL_UUID, testUuidv1)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should get public channel data by uuidv5', async () => {
    const item = {
      note: '',
      on: false,
      pk: `channel#${testUuidv5}`,
      sk: `info`,
      title: 'test-channel',
    }

    ddbMock.on(GetCommand).resolves({
      Item: item,
    })

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        channelID: testUuidv5,
      },
      requestContext: testRequestContext,
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(item),
    }

    expect(result).toEqual(expectedResult)
  })

  it('should get all channel data as owner by id', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        defaultNote: 'default note',
        note: '',
        on: false,
        pk: `user#${NIL_UUID}`,
        sk: `channel#${testUuidv1}`,
        title: 'test-channel',
      },
    })

    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          note: '',
          on: false,
          owner: 'supercoolguy',
          pk: `channel#${NIL_UUID}`,
          sk: `info`,
          title: 'test-channel',
        },
        {
          pk: `channel#${NIL_UUID}`,
          sk: `subscriber#${NIL_UUID}`,
          username: 'bestie',
        },
      ],
    })

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        channelID: testUuidv1,
      },
      requestContext: testRequestContext,
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        defaultNote: 'default note',
        note: '',
        on: false,
        pk: `user#${NIL_UUID}`,
        sk: `channel#${testUuidv1}`,
        title: 'test-channel',
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

  it('should 404 when empty ddb response', async () => {
    ddbMock.on(GetCommand).resolves({})

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        channelID: testUuidv1,
      },
      requestContext: testRequestContext,
    }

    const result = await getChannelHandler(event)

    const expectedResult = {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Not found' }),
    }

    expect(result).toEqual(expectedResult)
  })
})
