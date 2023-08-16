import { SubscriptionsDispatchActionType } from './subscriptionsReducer'

interface SubscriptionsDispatchAction {
  type: SubscriptionsDispatchActionType
  id?: string
  channel?: IChannel
  channels?: IChannel[]
}

interface SubscriptionsDispatch {
  dispatch: (action: SubscriptionsDispatchActionType) => void
}
