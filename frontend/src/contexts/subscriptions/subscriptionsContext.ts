import { createContext, useContext } from 'react'

export const SubscriptionsContext = createContext<IChannel[]>([])

export const SubscriptionsDispatchContext = createContext<
  React.Dispatch<SubscriptionsDispatchAction>
>(() => null)

export function useSubscriptions() {
  return useContext(SubscriptionsContext)
}

export function useSubscriptionsDispatch() {
  return useContext(SubscriptionsDispatchContext)
}
