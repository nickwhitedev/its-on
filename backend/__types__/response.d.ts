interface IResponseWithMessage {
  message: string
}

interface IOverviewResponse {
  channels?: IChannel[]
  notificationSubscriptions?: IUserNotificationSubscriptions
  profile?: IUser
  subscriptions?: IChannel[]
}
