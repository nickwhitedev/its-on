interface IChannel {
  id: string
  note: string
  on: boolean
  owner: string
  subscribers: IChannelSubscriber[]
  title: string
}

interface IPublicChannel {
  id: string
  owner: string
  title: string
}

interface IChannelSubscriber {
  id: string
  username: string
}
