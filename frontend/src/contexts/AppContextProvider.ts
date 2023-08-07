import combineComponents from '../utils/combineComponents'
import { ChannelsProvider } from './channels/ChannelsContext'
import { SubscriptionsProvider } from './subscriptions/SubscriptionsContext'

const providers = [ChannelsProvider, SubscriptionsProvider]

const AppContextProvider = combineComponents(...providers)

export default AppContextProvider
