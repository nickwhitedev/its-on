import { LoaderFunctionArgs } from '@remix-run/router/dist/utils'
import HomeBody from '../../components/HomeBody'
import Channels from '../../components/channels/Channels'
import PrivacyPolicy from '../../components/legal/PrivacyPolicy'
import TermsOfUse from '../../components/legal/TermsOfUse'
import Subscriptions from '../../components/subscriptions/Subscriptions'
import Support from '../../components/support/Support'
import ChannelRouteHandler from './channels/ChannelRouteHandler'
import Profile from '../../components/user/Profile'
import UpgradeSuccess from '../../components/upgrade/UpgradeSuccess'
import UpgradeSettings from '../../components/upgrade/UpgradeSettings'
import {
  ABOUT_PATH,
  CHANNELS_PATH,
  CSAE_PATH,
  PRIVACY_PATH,
  PROFILE_PATH,
  SUBSCRIPTIONS_PATH,
  SUPPORT_PATH,
  TERMS_PATH,
  UPGRADE_PATH,
  UPGRADE_SUCCESS_PATH,
} from '../../utils/urls'
import About from '../../components/about/About'
import CSAEPolicy from '../../components/legal/CSAEPolicy'

const appRouter = [
  {
    element: <HomeBody />,
    index: true,
  },
  {
    element: <Channels />,
    path: CHANNELS_PATH,
  },
  {
    element: <Subscriptions />,
    path: SUBSCRIPTIONS_PATH,
  },
  {
    element: <ChannelRouteHandler />,
    loader: ({ params }: LoaderFunctionArgs): { channelID: string | null } => {
      return { channelID: params.channelID ?? null }
    },
    path: ':channelID',
  },
  {
    element: <About />,
    path: ABOUT_PATH,
  },
  {
    element: <Profile />,
    path: PROFILE_PATH,
  },
  {
    element: <TermsOfUse />,
    path: TERMS_PATH,
  },
  {
    element: <PrivacyPolicy />,
    path: PRIVACY_PATH,
  },
  {
    element: <CSAEPolicy />,
    path: CSAE_PATH,
  },
  {
    element: <Support />,
    path: SUPPORT_PATH,
  },
  {
    element: <UpgradeSettings />,
    path: UPGRADE_PATH,
  },
  {
    element: <UpgradeSuccess />,
    path: UPGRADE_SUCCESS_PATH,
  },
]

export default appRouter
