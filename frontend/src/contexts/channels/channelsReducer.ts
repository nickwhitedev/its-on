import { channelsSorter } from '../../components/channels/channel/channelUtils'
import { ChannelsDispatchAction } from './channelsContextTypes'

export enum ChannelsDispatchActionType {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
  SYNCED = 'SYNCED',
}

export default function channelsReducer(
  channels: IChannel[],
  action: ChannelsDispatchAction,
): IChannel[] {
  switch (action.type) {
    case ChannelsDispatchActionType.ADDED: {
      if (action.channel == null) return channels
      return [action.channel, ...channels].sort(channelsSorter)
    }
    case ChannelsDispatchActionType.CHANGED: {
      return channels
        .map((channel: IChannel) => {
          if (channel.id === action.channel?.id) {
            return action.channel
          } else {
            return channel
          }
        })
        .sort(channelsSorter)
    }
    case ChannelsDispatchActionType.DELETED: {
      return channels
        .filter((channel: IChannel) => channel.id !== action.id)
        .sort(channelsSorter)
    }
    case ChannelsDispatchActionType.SYNCED: {
      return (action.channels ?? channels).sort(channelsSorter)
    }
  }
}
