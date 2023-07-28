import Channels from '../../components/channels/Channels.react'
import HomeBody from '../../components/HomeBody.react'
import Subscriptions from '../../components/subscriptions/Subscriptions.react'
import ChannelRouteHandler, {
  loader as channelLoader,
} from './channels/ChannelRouteHandler.react'

const appRouter = [
  {
    element: <HomeBody />,
    index: true,
  },
  {
    element: <ChannelRouteHandler />,
    loader: channelLoader,
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
