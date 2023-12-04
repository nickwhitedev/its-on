import './ErrorSnackbar.css'

import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import MDElevation from '../material/MDElevation'
import MDIcon from '../material/MDIcon'
import MDIconButton from '../material/icon-button/MDIconButton'
import { PropsWithChildren } from 'react'
import { useErrorDispatch } from '../../contexts/error/errorContext'

const ErrorSnackbar = ({ children }: PropsWithChildren) => {
  const dispatchError = useErrorDispatch()
  return (
    <div className="ErrorSnackbar">
      <MDElevation />
      <span>{children ?? 'Something unexpected happened...'}</span>
      <MDIconButton
        className="ErrorSnackbar-close-button"
        onClick={() => {
          dispatchError({
            type: ErrorDispatchActionType.ERROR_SNACKBAR_CLOSED,
          })
        }}
      >
        <MDIcon>close</MDIcon>
      </MDIconButton>
    </div>
  )
}

export default ErrorSnackbar
