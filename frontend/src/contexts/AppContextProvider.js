import combineComponents from '../utils/combineComponents'
import { ChannelsProvider } from './ChannelsContext'
import { SubscriptionsProvider } from './SubscriptionsContext'

const providers = [ChannelsProvider, SubscriptionsProvider]

const AppContextProvider = combineComponents(...providers)

export default AppContextProvider
