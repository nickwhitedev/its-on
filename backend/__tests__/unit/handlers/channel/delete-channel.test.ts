import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockEvent from '../../../../__mocks__/mock-event.js'
import { CORS_HEADERS } from '../../../../src/common/constants.mjs'
import { deleteChannelHandler } from '../../../../src/handlers/channel/delete-channel.mjs'

describe('Test deleteHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should delete channel', async () => {
    ddbMock.on(DeleteCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'DELETE',
      pathParameters: {
        channelID: 'someID',
      },
    }

    const result = await deleteChannelHandler(event)

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(204)

    expect(resultBody).toEqual({ message: 'Deleted' })
  })
})
