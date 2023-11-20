import { CORS_HEADERS, ENV } from './constants.js'

interface ICreateResponseParams {
  eventPath: string
  responseBody: object
  statusCode: number
}

interface IResponse {
  body: string
  headers: {
    'Access-Control-Allow-Headers': string
    'Access-Control-Allow-Origin': string
    'Access-Control-Allow-Methods': string
  }
  statusCode: number
}

export const createResponse = ({
  eventPath,
  responseBody,
  statusCode,
}: ICreateResponseParams): IResponse => {
  if (ENV !== 'prod') {
    console.debug(`response from: ${eventPath}: `, {
      responseBody,
      statusCode,
    })
  }

  return {
    body: JSON.stringify(responseBody),
    headers: CORS_HEADERS,
    statusCode: statusCode,
  }
}
