import { getOverviewHandler } from '../../../src/handlers/get-overview.mjs'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { CORS_HEADERS } from '../../../src/utils/constants.mjs'
import { testRequestContext } from '../../util/constants.mjs'

// This includes all tests for getOverviewHandler()
describe('Test getOverviewHandler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return ids', async () => {
    const items = [{ id: 'id1' }, { id: 'id2' }]

    // Return the specified value whenever the spied scan function is called
    ddbMock.on(QueryCommand).resolves(items)

    const event = {
      httpMethod: 'GET',
      requestContext: testRequestContext,
    }

    // Invoke helloFromLambdaHandler()
    const result = await getOverviewHandler(event)

    const expectedResult = {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(items),
    }

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult)
  })
})
