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
  ownerID?: string
  subscriberCount?: number
  subscribers?: IChannelSubscriber[]
  title?: string
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

interface IDurationOptions {
  displayName: string
  value: number
}
