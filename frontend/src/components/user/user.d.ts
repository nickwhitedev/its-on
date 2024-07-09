type TNotificationTokens = Record<string, { lastUpdated: number }>

interface IUser {
  channelCount?: number
  eligibleForUpgrade?: boolean
  id?: string
  lastNewSubscriberNotification?: number
  notificationTokens?: TNotificationTokens
  notificationsEnabled?: boolean
  subscriptionCount?: number
  subscriptionTopics?: Set<string>
  tier?: number
  unlimited?: boolean
  upgradeQualifyingEventTimestamps?: number[]
  username?: string
}
