import {
  loader as channelLoader,
} from './channels/ChannelRouteHandler'

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
