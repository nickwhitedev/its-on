import combineComponents from '../utils/combineComponents'
import ChannelsProvider from './channels/ChannelsProvider'
import SubscriptionsProvider from './subscriptions/SubscriptionsProvider'

const providers = [ChannelsProvider, SubscriptionsProvider]

const AppContextProvider = combineComponents(...providers)

export default AppContextProvider
