import { ChannelsDispatchActionType } from './channelsReducer'

interface ChannelsDispatchAction {
  type: ChannelsDispatchActionType
  id?: string
  channel?: IChannel
  channels?: IChannel[]
}

interface ChannelsDispatch {
  dispatch: (action: ChannelsDispatchActionType) => void
}
