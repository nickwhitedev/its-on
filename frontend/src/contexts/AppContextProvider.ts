import combineComponents from '../utils/combineComponents'
import ChannelsProvider from './channels/ChannelsProvider'
import SubscriptionsProvider from './subscriptions/SubscriptionsProvider'

const AppContextProvider = combineComponents(
  ...[ChannelsProvider, SubscriptionsProvider],
)

export default AppContextProvider
