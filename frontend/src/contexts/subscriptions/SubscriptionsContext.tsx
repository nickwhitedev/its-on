import { PropsWithChildren, createContext, useContext, useReducer } from 'react'

const SubscriptionsContext = createContext<IChannel[]>([])

const SubscriptionsDispatchContext = createContext<React.Dispatch<SubscriptionsDispatchAction>>(() => null)

export function SubscriptionsProvider({ children }: PropsWithChildren) {
  const [subscriptions, dispatch] = useReducer(subscriptionsReducer, [])

  return (
    <SubscriptionsContext.Provider value={subscriptions}>
      <SubscriptionsDispatchContext.Provider value={dispatch}>
        {children}
      </SubscriptionsDispatchContext.Provider>
    </SubscriptionsContext.Provider>
  )
}

export function useSubscriptions() {
  return useContext(SubscriptionsContext)
}

export function useSubscriptionsDispatch() {
  return useContext(SubscriptionsDispatchContext)
}

function subscriptionsReducer(subscriptions: IChannel[], action: SubscriptionsDispatchAction): IChannel[] {
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
      return subscriptions.filter((channel: IChannel) => channel.id !== action.id)
    }
    case SubscriptionsDispatchActionType.SYNCED: {
      return action.channels ?? subscriptions
    }
    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}
