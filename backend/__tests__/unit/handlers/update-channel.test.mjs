import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { jest } from '@jest/globals'
import { mockClient } from 'aws-sdk-client-mock'
import { updateChannelHandler } from '../../../src/handlers/update-channel.mjs'
import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { testRequestContext } from '../../util/constants.mjs'

// This includes all tests for updateChannelHandler()
describe('Test updateChannelHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  // This test invokes updateChannelHandler() and compare the result
  it('should add id to the table', async () => {
    const returnedItem = {}

    // Return the specified value whenever the spied put function is called
    ddbMock.on(BatchWriteCommand).resolves({
      returnedItem,
    })

    const event = {
      body: '{"compositeID": "00000000-0000-0000-0000-000000000000","defaultNote": "test note","id": "00000000-0000-0000-0000-000000000000","on": false,"note": "hello","title": "Super Channel"}',
      httpMethod: 'PUT',
      requestContext: testRequestContext,
    }

    // Invoke updateChannelHandler()
    const result = await updateChannelHandler(event)

    const resultBody = JSON.parse(result.body)
    // Compare the result with the expected result
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)

    expect(Object.keys(resultBody)).toEqual([
      'compositeID',
      'defaultNote',
      'id',
      'note',
      'on',
      'title',
    ])
    expect(resultBody.defaultNote).toEqual('test note')
    expect(resultBody.note).toEqual('hello')
    expect(resultBody.on).toEqual(false)
    expect(resultBody.title).toEqual('Super Channel')
  })
})
