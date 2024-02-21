import { PropsWithChildren, useReducer } from 'react'
import { UserContext, UserDispatchContext } from './userContext'

import userReducer from './userReducer'

export default function UserProvider({ children }: PropsWithChildren) {
  const [user, dispatch] = useReducer(userReducer, null)

  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  )
}
