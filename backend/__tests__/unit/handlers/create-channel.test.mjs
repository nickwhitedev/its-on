import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { jest } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { createChannelHandler } from '../../../src/handlers/create-channel.mjs';
import { CORS_HEADERS } from '../../../src/utils/constants.mjs';
import { testRequestContext } from '../../util/constants.mjs';
// This includes all tests for createChannelHandler() 
describe('Test createChannelHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  jest
    .useFakeTimers()
    .setSystemTime(new Date('2020-01-01'));

  beforeEach(() => {
    ddbMock.reset();
  });

  // This test invokes createChannelHandler() and compare the result  
  it('should add id to the table', async () => {
    const returnedItem = { id: 'id1', name: 'name1' };

    // Return the specified value whenever the spied put function is called 
    ddbMock.on(BatchWriteCommand).resolves({
      returnedItem
    });

    const event = {
      body: '{"id": "id1","name": "name1"}',
      httpMethod: 'POST',
      requestContext: testRequestContext,
    };

    // Invoke createChannelHandler() 
    const result = await createChannelHandler(event);

    const expectedResult = {
      body: JSON.stringify({ createdTime: Date.now(), on: false, note: '' }),
      headers: CORS_HEADERS,
      statusCode: 201,
    };

    // Compare the result with the expected result 
    expect(result).toEqual(expectedResult);
  });
});
