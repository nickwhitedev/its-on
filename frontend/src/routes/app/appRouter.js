import Channel from '../../components/channels/channel/Channel.react'
import Channels from '../../components/channels/Channels.react'
import HomeBody from '../../components/HomeBody.react'
import Subscriptions from '../../components/subscriptions/Subscriptions.react'

const appRouter = [
  {
    element: <HomeBody />,
    index: true,
  },
  {
    element: <Channel />,
    path: 'channels/:channelID',
  },
  {
    element: <Channels />,
    path: 'channels',
  },
  {
    element: <Subscriptions />,
    path: 'subscriptions',
  },
]

export default appRouter
