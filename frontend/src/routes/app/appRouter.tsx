import { LoaderFunctionArgs } from '@remix-run/router/dist/utils'
import HomeBody from '../../components/HomeBody'
import Channels from '../../components/channels/Channels'
import PrivacyPolicy from '../../components/legal/PrivacyPolicy'
import TermsOfUse from '../../components/legal/TermsOfUse'
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
  {
    element: <TermsOfUse />,
    path: 'terms',
  },
  {
    element: <PrivacyPolicy />,
    path: 'privacy',
  },
]

export default appRouter
