import { ErrorContext, ErrorDispatchContext } from './errorContext'
import { PropsWithChildren, useReducer } from 'react'

import errorReducer from './errorReducer'

export default function ErrorProvider({ children }: PropsWithChildren) {
  const [error, dispatch] = useReducer(errorReducer, {
    message: null,
    isVisible: false,
  })

  return (
    <ErrorContext.Provider value={error}>
      <ErrorDispatchContext.Provider value={dispatch}>
        {children}
      </ErrorDispatchContext.Provider>
    </ErrorContext.Provider>
  )
}
