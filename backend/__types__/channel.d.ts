interface IChannel {
  id: string
  note: string
  on: boolean
  owner: string
  subscribers: IChannelSubscriber[]
  title: string
}

interface IChannelSubscriber {
  id: string
  username: string
}
