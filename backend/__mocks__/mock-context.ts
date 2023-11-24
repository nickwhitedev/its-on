import { Context } from 'aws-lambda'

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn',
  memoryLimitInMB: '1',
  awsRequestId: 'aws',
  logGroupName: 'log',
  logStreamName: 'stream',
  getRemainingTimeInMillis: () => 0,
  done: () => null,
  fail: () => null,
  succeed: () => null,
}

export default mockContext
