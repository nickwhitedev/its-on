import { ErrorDispatchActionType } from './errorReducer'

interface ErrorDispatchAction {
  type: ErrorDispatchActionType
  id?: string
  message?: string | null
}

interface ErrorDispatch {
  dispatch: (action: ErrorDispatchActionType) => void
}

interface ErrorSnackbarState {
  message: string | null
  isVisible: boolean
}
