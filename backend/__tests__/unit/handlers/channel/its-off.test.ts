import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../../__mocks__/mock-event'
import { CORS_HEADERS } from '../../../../src/common/constants'
import { itsOffHandler } from '../../../../src/handlers/channel/its-off'

describe('Test itsOffHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should return Its Off', async () => {
    ddbMock.on(UpdateCommand).resolves({})
    ddbMock.on(GetCommand).resolves({ Item: {} })

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      pathParameters: {
        channelID: 'someID',
      },
    }

    const result = await itsOffHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage

    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(200)
    expect(resultBody.message).toEqual("It's Off")
  })
})
