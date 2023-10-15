interface IResponseWithMessage {
  message: string
}

interface IOverviewResponse {
  channels?: IChannel[]
  profile?: IUser
  subscriptions?: IChannel[]
}
