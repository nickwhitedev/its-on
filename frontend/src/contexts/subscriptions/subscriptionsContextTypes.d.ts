enum SubscriptionsDispatchActionType {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
  SYNCED = 'SYNCED',
}

interface SubscriptionsDispatchAction {
  type: SubscriptionsDispatchActionType
  id?: string
  channel?: IChannel
  channels?: IChannel[]
}

interface SubscriptionsDispatch {
  dispatch: (action: SubscriptionsDispatchActionType) => void
}
