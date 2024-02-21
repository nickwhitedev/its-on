import { createContext, useContext } from 'react'

import { UserDispatchAction } from './userContextTypes'

export const UserContext = createContext<IUser | null>(null)

export const UserDispatchContext = createContext<
  React.Dispatch<UserDispatchAction>
>(() => null)

export function useUser() {
  return useContext(UserContext)
}

export function useUserDispatch() {
  return useContext(UserDispatchContext)
}
