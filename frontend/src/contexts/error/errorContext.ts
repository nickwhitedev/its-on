import { ErrorDispatchAction, ErrorSnackbarState } from './errorContextTypes'
import { createContext, useContext } from 'react'

export const ErrorContext = createContext<ErrorSnackbarState>({
  message: null,
  isVisible: false,
})

export const ErrorDispatchContext = createContext<
  React.Dispatch<ErrorDispatchAction>
>(() => null)

export function useError() {
  return useContext(ErrorContext)
}

export function useErrorDispatch() {
  return useContext(ErrorDispatchContext)
}
