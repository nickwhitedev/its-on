interface IUser {
  channelCount?: number
  id?: string
  notificationSubscriptions?: Record<string, PushSubscription>
  notificationsEnabled?: boolean
  subscriptionCount?: number
  tier?: number
  username?: string
}
