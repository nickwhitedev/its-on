import { PropsWithChildren, useReducer } from 'react'
import { SubscriptionsContext, SubscriptionsDispatchContext } from './subscriptionsContext'
import subscriptionsReducer from './subscriptionsReducer'

export default function SubscriptionsProvider({ children }: PropsWithChildren) {
  const [subscriptions, dispatch] = useReducer(subscriptionsReducer, [])

  return (
    <SubscriptionsContext.Provider value={subscriptions}>
      <SubscriptionsDispatchContext.Provider value={dispatch}>
        {children}
      </SubscriptionsDispatchContext.Provider>
    </SubscriptionsContext.Provider>
  )
}
