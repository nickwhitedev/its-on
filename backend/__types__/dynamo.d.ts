/**
 * Represents a channel
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
 */
interface IDynamoChannelItem {
  deleted?: boolean
  note: string
  on: boolean
  owner: string
  pk: string
  sk: string
  title: string
}

interface IDynamoStreamChannelImage {
  note: {
    S: string
  }
  on: {
    BOOL: boolean
  }
  owner: {
    S: string
  }
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  title: {
    S: string
  }
}

/**
 * Represents a channel's subscriber
 *
 * - pk = 'channel#<channelID>'
 * - sk = 'subscriber#<userID>'
 */
interface IDynamoChannelSubscriber {
  pk: string
  sk: string
  username: string
}

interface IDynamoStreamChannelSubscriberImage {
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  username: {
    S: string
  }
}
