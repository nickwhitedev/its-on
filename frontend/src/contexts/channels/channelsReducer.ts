import { isChannelOn } from '../../components/channels/channel/channelUtils'
import { ChannelsDispatchAction } from './channelsContextTypes'

export enum ChannelsDispatchActionType {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
  SYNCED = 'SYNCED',
}

const channelsSorter = (channelA: IChannel, channelB: IChannel): number => {
  const isChannelAOn = isChannelOn(channelA)
  const isChannelBOn = isChannelOn(channelB)
  if (isChannelAOn !== isChannelBOn) {
    return isChannelAOn ? -1 : 1
  }
  return (channelB.lastUpdated ?? 0) - (channelA.lastUpdated ?? 0)
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
      return channels.map((channel: IChannel) => {
        if (channel.id === action.channel?.id) {
          return action.channel
        } else {
          return channel
        }
      })
    }
    case ChannelsDispatchActionType.DELETED: {
      return channels.filter((channel: IChannel) => channel.id !== action.id)
    }
    case ChannelsDispatchActionType.SYNCED: {
      return action.channels ?? channels
    }
  }
}
