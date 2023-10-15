import ChannelsProvider from './channels/ChannelsProvider'
import SubscriptionsProvider from './subscriptions/SubscriptionsProvider'
import UserProvider from './user/userProvider'
import combineComponents from '../utils/combineComponents'

const AppContextProvider = combineComponents(
  ...[ChannelsProvider, SubscriptionsProvider, UserProvider],
)

export default AppContextProvider
