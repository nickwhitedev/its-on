/**
 * Represents a Channel object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IChannel {
  canceled?: boolean
  capacity?: number
  deleted?: boolean
  duration?: number
  id: string
  lastOn?: number
  lastOnDuration?: number
  lastUpdated?: number
  note?: string
  owner?: string
  subscribers?: IChannelSubscriber[]
  title?: string
}

/**
 * Represents a channel item that has been parsed from DynamoDB
 *
 * Could be one of these versions:
 * - User's copy (private and source of truth)
 *   - pk = 'user#<userID>'
 *   - sk = 'channel#<channelID>'
 * - Public copy
 *   - pk = 'channel#<channelID>'
 *   - sk = 'info'\
 * - Subscriber copy (distributed copy for performance)
 *   - pk = 'user#<userID>'
 *   - sk = 'subscription#<channelID>'
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoChannelItem {
  canceled?: boolean
  capacity?: number
  deleted?: boolean
  duration?: number
  lastOn?: number
  lastOnDuration?: number
  lastUpdated?: number
  note?: string
  owner?: string
  pk: string
  sk: string
  title?: string
}

/**
 * Represents a channel item in raw DynamoDB form
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoStreamChannelImage {
  canceled?: {
    BOOL?: boolean
  }
  capacity?: {
    N?: number
  }
  deleted?: {
    BOOL?: boolean
  }
  duration?: {
    N?: number
  }
  lastOn?: {
    N?: number
  }
  lastOnDuration?: {
    N?: number
  }
  lastUpdated?: {
    N?: number
  }
  note?: {
    S?: string
  }
  owner?: {
    S?: string
  }
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  title?: {
    S?: string
  }
}

/**
 * Represents a Subscriber object
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IChannelSubscriber {
  id: string
  username?: string
}

/**
 * Represents a channel's subscriber parsed from DynamoDB
 *
 * - pk = 'channel#<channelID>'
 * - sk = 'subscriber#<userID>'
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoChannelSubscriber {
  pk: string
  sk: string
  username?: string
}

/**
 * Represents a channel's subscriber in raw DynamoDB form
 *
 * - pk = 'channel#<channelID>'
 * - sk = 'subscriber#<userID>'
 *
 * Make attributes required to check for code completeness.
 * Leave attributes optional for null-safety.
 * DynamoDB guarantees nothing but keys.
 */
interface IDynamoStreamChannelSubscriberImage {
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  username?: {
    S?: string
  }
}
