import ChannelRouteHandler from './channels/ChannelRouteHandler'
import Channels from '../../components/channels/Channels'
import HomeBody from '../../components/HomeBody'
import { LoaderFunctionArgs } from '@remix-run/router/dist/utils'
import ProfileMenu from '../../components/profile/ProfileMenu'
import Subscriptions from '../../components/subscriptions/Subscriptions'

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
  {
    element: <ProfileMenu />,
    path: '/profile',
  },
]

export default appRouter
