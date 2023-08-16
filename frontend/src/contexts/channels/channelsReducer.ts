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
      return [action.channel, ...channels]
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
