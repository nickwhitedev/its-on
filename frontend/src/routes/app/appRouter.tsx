import { LoaderFunctionArgs } from '@remix-run/router/dist/utils'
import HomeBody from '../../components/HomeBody'
import Channels from '../../components/channels/Channels'
import Subscriptions from '../../components/subscriptions/Subscriptions'
import ChannelRouteHandler from './channels/ChannelRouteHandler'

const appRouter = [
  {
    element: <HomeBody />,
    index: true,
  },
  {
    element: <Channels />,
    path: 'channels',
  },
  {
    element: <Subscriptions />,
    path: 'subscriptions',
  },
  {
    element: <ChannelRouteHandler />,
    loader: ({ params }: LoaderFunctionArgs): { channelID: string | null } => {
      return { channelID: params.channelID ?? null }
    },
    path: ':channelID',
  },
]

export default appRouter
