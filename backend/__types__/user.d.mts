/**
 * Represents a User object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IUser {
  channelCount: number
  eligibleForUpgrade?: boolean
  id: string
  lastNewSubscriberNotification?: number
  notificationTokens?: Record<string, { lastUpdated: number }>
  notificationsEnabled: boolean
  subscriptionCount: number
  subscriptionTopics?: Set<string>
  tier: number
  unlimited?: boolean
  upgradeQualifyingEventTimestamps?: number[]
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
  eligibleForUpgrade?: boolean
  lastNewSubscriberNotification?: number
  notificationTokens?: Record<string, { lastUpdated: number }>
  notificationsEnabled: boolean
  pk: string
  sk: string
  subscriptionCount: number
  subscriptionTopics?: Set<string>
  tier: number
  unlimited?: boolean
  upgradeQualifyingEventTimestamps?: number[]
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
  eligibleForUpgrade?: {
    B: boolean
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
  unlimited?: {
    B: boolean
  }
  upgradeQualifyingEventTimestamps?: {
    L: number[]
  }
  username: {
    S: string
  }
}
