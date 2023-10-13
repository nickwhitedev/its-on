/**
 * Represents a User object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IUser {
  subscriptionCount: number
  tier: number
  username: string
}

/**
 * Represents a user item that has been parsed from DynamoDB
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoUserItem {
  pk: string
  sk: string
  subscriptionCount: number
  tier: number
  username: string
}

/**
 * Represents a user item in raw DynamoDB form
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoStreamUserImage {
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  subscriptionCount: {
    N: number
  }
  tier: {
    N: number
  }
  username: {
    S: string
  }
}
