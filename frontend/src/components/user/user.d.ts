type TNotificationTokens = Record<string, { lastUpdated: number }>

interface IUser {
  channelCount?: number
  id?: string
  lastNewSubscriberNotification?: number
  notificationTokens?: TNotificationTokens
  notificationsEnabled?: boolean
  subscriptionCount?: number
  subscriptionTopics?: Set<string>
  tier?: number
  unlimited?: boolean
  username?: string
}
