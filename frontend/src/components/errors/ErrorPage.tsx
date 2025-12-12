import { useEffect, useRef } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { useSendLog } from '../../utils/logging'

export default function ErrorPage() {
  const error = useRouteError()
  const sendLog = useSendLog()
  const hasLoggedRef = useRef<boolean>(false)

  const errorMessage = (() => {
    if (isRouteErrorResponse(error)) {
      return error.statusText
    }

    if (error instanceof Error) {
      return error.message
    }

    if (typeof error === 'string') {
      return error
    }

    return 'Unknown error'
  })()

  useEffect(() => {
    // Log unknown or unexpected errors only once
    if (
      !hasLoggedRef.current &&
      !isRouteErrorResponse(error) &&
      !(error instanceof Error) &&
      typeof error !== 'string'
    ) {
      void sendLog('ErrorPage unknown error')
      hasLoggedRef.current = true
    }
  }, [error, sendLog])

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </div>
  )
}
