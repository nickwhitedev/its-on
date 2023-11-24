/**
 * Represents a User object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IUser {
  channelCount: number
  notificationsEnabled: boolean
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
  channelCount: number
  notificationsEnabled: boolean
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
  channelCount: {
    N: number
  }
  notificationsEnabled: {
    B: boolean
  }
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

/**
 * Represents a UserNotificationSubscription object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IUserNotificationSubscriptions {
  subscriptions: Record<string, PushSubscription>
}

/**
 * Represents a user notification subscription item that has been parsed from
 * DynamoDB
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoUserNotificationSubscriptionsItem {
  pk: string
  sk: string
  subscriptions: Record<string, string>
}

/**
 * Represents a user notification subscription item in raw DynamoDB form
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoStreamUserNotificationSubscriptionsImage {
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  subscriptions: {
    M: Record<string, { S: string }>
  }
}
