import ChannelsProvider from './channels/ChannelsProvider'
import ErrorProvider from './error/errorProvider'
import SubscriptionsProvider from './subscriptions/SubscriptionsProvider'
import UserProvider from './user/userProvider'
import combineComponents from '../utils/combineComponents'

const AppContextProvider = combineComponents(
  ...[ChannelsProvider, ErrorProvider, SubscriptionsProvider, UserProvider],
)

export default AppContextProvider
