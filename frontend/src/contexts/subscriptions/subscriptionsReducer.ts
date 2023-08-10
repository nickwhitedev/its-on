export default function subscriptionsReducer(
  subscriptions: IChannel[],
  action: SubscriptionsDispatchAction,
): IChannel[] {
  switch (action.type) {
    case SubscriptionsDispatchActionType.ADDED: {
      if (action.channel == null) return subscriptions
      return [action.channel, ...subscriptions]
    }
    case SubscriptionsDispatchActionType.CHANGED: {
      return subscriptions.map((channel: IChannel) => {
        if (channel.id === action.channel?.id) {
          return action.channel
        } else {
          return channel
        }
      })
    }
    case SubscriptionsDispatchActionType.DELETED: {
      return subscriptions.filter(
        (channel: IChannel) => channel.id !== action.id,
      )
    }
    case SubscriptionsDispatchActionType.SYNCED: {
      return action.channels ?? subscriptions
    }
  }
}
