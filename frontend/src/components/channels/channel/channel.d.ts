interface IChannel {
  deleted?: boolean
  duration: number
  id: string
  lastOn: number
  lastUpdated: number
  note: string
  owner: string
  subscribers: IChannelSubscriber[]
  title: string
}

interface IChannelSubscriber {
  id: string
  username: string
}
