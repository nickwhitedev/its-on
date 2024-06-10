/**
 * Represents a User object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IUser {
  channelCount: number
  id: string
  lastNewSubscriberNotification?: number
  notificationTokens?: Record<string, { lastUpdated: number }>
  notificationsEnabled: boolean
  subscriptionCount: number
  subscriptionTopics?: Set<string>
  tier: number
  upgradeQualifyingEventTimestamps: number[]
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
  lastNewSubscriberNotification?: number
  notificationTokens?: Record<string, { lastUpdated: number }>
  notificationsEnabled: boolean
  pk: string
  sk: string
  subscriptionCount: number
  subscriptionTopics?: Set<string>
  tier: number
  upgradeQualifyingEventTimestamps: number[]
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
  lastNewSubscriberNotification?: {
    N: number
  }
  notificationTokens?: {
    M: Record<
      string,
      {
        M: {
          lastUpdated: { N: number }
        }
      }
    >
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
  subscriptionTopics?: {
    SS: Set<string>
  }
  tier: {
    N: number
  }
  upgradeQualifyingEventTimestamps: {
    L: number[]
  }
  username: {
    S: string
  }
}
