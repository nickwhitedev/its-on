import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { jest } from '@jest/globals'
import { mockClient } from 'aws-sdk-client-mock'
import { NIL as NIL_UUID, v1 as uuidv1, v5 as uuidv5 } from 'uuid'
import { unsubscribeHandler } from '../../../src/handlers/unsubscribe.mjs'
import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { testRequestContext } from '../../util/constants.mjs'

// This includes all tests for unsubscribeHandler()
describe('Test unsubscribeHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  const testUuidv1 = uuidv1()
  const testUuidv5 = uuidv5(NIL_UUID, testUuidv1)

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes createChannelHandler() and compare the result
  it('should add id to the table', async () => {
    // Return the specified value whenever the spied put function is called
    ddbMock.on(BatchWriteCommand).resolves({
      returnedItem: {},
    })

    const event = {
      httpMethod: 'POST',
      pathParameters: {
        channelID: testUuidv5,
      },
      requestContext: testRequestContext,
    }

    // Invoke unsubscribeHandler()
    const result = await unsubscribeHandler(event)

    const resultBody = JSON.parse(result.body)
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)

    expect(resultBody).toEqual({ message: 'Unsubscribed' })
  })
})
