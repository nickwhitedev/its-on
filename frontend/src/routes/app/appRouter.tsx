import { LoaderFunctionArgs } from '@remix-run/router/dist/utils'
import HomeBody from '../../components/HomeBody'
import Channels from '../../components/channels/Channels'
import Subscriptions from '../../components/subscriptions/Subscriptions'
import { fetchApi } from '../../utils/api'
import ChannelRouteHandler from './channels/ChannelRouteHandler'

const appRouter = [
  {
    element: <HomeBody />,
    index: true,
  },
  {
    element: <ChannelRouteHandler />,
    loader: async ({params}: LoaderFunctionArgs): Promise<{ channel: IChannel }> => {
      const channel = await fetchApi<IChannel>(`/${params.channelID}`)
      return { channel }
    },
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
