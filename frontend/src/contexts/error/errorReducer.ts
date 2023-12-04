import { ErrorDispatchAction, ErrorSnackbarState } from './errorContextTypes'

export enum ErrorDispatchActionType {
  ERROR_SNACKBAR_CLOSED = 'ERROR_SNACKBAR_CLOSED',
  ERROR_SNACKBAR_TRIGGERED = 'ERROR_SNACKBAR_TRIGGERED',
}

export default function errorReducer(
  _errorState: ErrorSnackbarState,
  action: ErrorDispatchAction,
): ErrorSnackbarState {
  switch (action.type) {
    case ErrorDispatchActionType.ERROR_SNACKBAR_CLOSED: {
      return { message: null, isVisible: false }
    }
    case ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED: {
      return { message: action.message ?? null, isVisible: true }
    }
  }
}
