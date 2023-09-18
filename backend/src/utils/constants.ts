export const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Authorization,*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
}

export const DYNAMODB_TABLE_NAME: string = process.env.ITS_ON_TABLE ?? ''
