import { CORS_HEADERS, ENV } from './constants.mjs'

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
    body: JSON.stringify(responseBody, (_key, value) =>
      // https://stackoverflow.com/a/46491780 Use a replacer function to handle Sets
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      value instanceof Set ? [...value] : value,
    ),
    headers: CORS_HEADERS,
    statusCode: statusCode,
  }
}
