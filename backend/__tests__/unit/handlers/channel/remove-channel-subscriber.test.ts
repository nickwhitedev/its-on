import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { jest } from '@jest/globals'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import mockContext from '../../../../__mocks__/mock-context.js'
import mockEvent from '../../../../__mocks__/mock-event.js'
import { CORS_HEADERS } from '../../../../src/common/constants.mjs'
import removeChannelSubscriber from '../../../../src/handlers/channel/remove-channel-subscriber/remove-channel-subscriber.mjs'

describe('Test removeChannelSubscriberHandler', function () {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const silentLogger = new Logger({ logLevel: 'SILENT' })
  const metrics = new Metrics()
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))

  beforeEach(() => {
    ddbMock.reset()
  })

  it('should unsubscribe user from channel', async () => {
    ddbMock.on(BatchWriteCommand).resolves({})
    ddbMock.on(GetCommand).resolves({})
    ddbMock.on(UpdateCommand).resolves({})

    const event: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'DELETE',
      pathParameters: {
        channelID: 'someID',
        subscriberID: 'subscriber-id',
      },
    }

    const result = await removeChannelSubscriber(
      event,
      mockContext,
      silentLogger,
      metrics,
    )

    const resultBody = JSON.parse(result.body) as IResponseWithMessage
    expect(result.headers).toEqual(CORS_HEADERS)
    expect(result.statusCode).toEqual(204)

    expect(resultBody).toEqual({ message: 'Subscriber removed' })
  })
})
