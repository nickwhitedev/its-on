import { channelsSorter } from '../../components/channels/channel/channelUtils'
import { SubscriptionsDispatchAction } from './subscriptionsContextTypes'

export enum SubscriptionsDispatchActionType {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
  SYNCED = 'SYNCED',
}

export default function subscriptionsReducer(
  subscriptions: IChannel[],
  action: SubscriptionsDispatchAction,
): IChannel[] {
  switch (action.type) {
    case SubscriptionsDispatchActionType.ADDED: {
      if (action.channel == null) return subscriptions
      return [action.channel, ...subscriptions].sort(channelsSorter)
    }
    case SubscriptionsDispatchActionType.CHANGED: {
      return subscriptions
        .map((channel: IChannel) => {
          if (channel.id === action.channel?.id) {
            return action.channel
          } else {
            return channel
          }
        })
        .sort(channelsSorter)
    }
    case SubscriptionsDispatchActionType.DELETED: {
      return subscriptions
        .filter((channel: IChannel) => channel.id !== action.id)
        .sort(channelsSorter)
    }
    case SubscriptionsDispatchActionType.SYNCED: {
      return (action.channels ?? subscriptions).sort(channelsSorter)
    }
  }
}
