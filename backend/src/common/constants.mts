export const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Authorization,*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
}

export const DYNAMODB_TABLE_NAME: string = process.env.ITS_ON_TABLE ?? ''

export const PUSH_NOTIFICATION_PUBLIC_KEY: string =
  process.env.PUSH_NOTIFICATION_PUBLIC_KEY ?? ''

export const PUSH_NOTIFICATION_PRIVATE_KEY: string =
  process.env.PUSH_NOTIFICATION_PRIVATE_KEY ?? ''

export const WEB_URL = process.env.WEB_URL ?? 'https://itson.fyi'

export const ENV = process.env.ENV

export const SKUS_TO_TIERS = {
  TIER_10: 10,
  TIER_25: 25,
  TIER_100: 100,
}

export const TOP_TIER = SKUS_TO_TIERS.TIER_100

export const UNLIMITED_SUBSCRIPTION_SKU = 'TIER_UNLIMITED'
