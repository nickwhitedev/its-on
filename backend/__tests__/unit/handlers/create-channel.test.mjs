import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { jest } from '@jest/globals'
import { mockClient } from 'aws-sdk-client-mock'
import { createChannelHandler } from '../../../src/handlers/create-channel.mjs'
import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { testRequestContext } from '../../util/constants.mjs'

// This includes all tests for createChannelHandler()
describe('Test createChannelHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes createChannelHandler() and compare the result
  it('should add id to the table', async () => {
    const returnedItem = {}

    // Return the specified value whenever the spied put function is called
    ddbMock.on(BatchWriteCommand).resolves({
      returnedItem,
    })

    const event = {
      body: '{"defaultNote": "test note","title": "Super Channel"}',
      httpMethod: 'POST',
      requestContext: testRequestContext,
    }

    // Invoke createChannelHandler()
    const result = await createChannelHandler(event)

    const resultBody = JSON.parse(result.body)
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(201)
    expect(resultBody.defaultNote).toEqual('test note')
    expect(resultBody.note).toEqual('')
    expect(resultBody.on).toEqual(false)
    expect(resultBody.title).toEqual('Super Channel')
  })
})
