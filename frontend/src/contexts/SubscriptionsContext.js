import { createContext, useContext, useReducer } from 'react'

const SubscriptionsContext = createContext(null)

const SubscriptionsDispatchContext = createContext(null)

export function SubscriptionsProvider({ children }) {
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

function subscriptionsReducer(subscriptions, action) {
  switch (action.type) {
    case 'added': {
      return [action.subscription, ...subscriptions]
    }
    case 'changed': {
      return subscriptions.map(t => {
        if (t.id === action.subscription.id) {
          return action.subscription
        } else {
          return t
        }
      })
    }
    case 'deleted': {
      return subscriptions.filter(t => t.id !== action.id)
    }
    case 'synced': {
      return action.subscriptions
    }
    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}
