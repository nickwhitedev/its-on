enum ChannelsDispatchActionType {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
  SYNCED = 'SYNCED',
}

interface ChannelsDispatchAction {
  type: ChannelsDispatchActionType
  id?: string
  channel?: IChannel
  channels?: IChannel[]
}

interface ChannelsDispatch {
  dispatch: (action: ChannelsDispatchActionType) => void
}
