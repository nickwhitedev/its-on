interface IResponseWithMessage {
  message: string
}

interface IOverviewResponse {
  channels: IChannel[]
  profile: object
  subscriptions: IChannel[]
}
