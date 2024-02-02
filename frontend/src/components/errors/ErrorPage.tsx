import { useEffect, useState } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { useSendLog } from '../../utils/logging'

export default function ErrorPage() {
  const error = useRouteError()
  const sendLog = useSendLog()

  let errorMessage: string

  const [sendError, setSendError] = useState<boolean>(false)

  useEffect(() => {
    if (sendError) {
      void (async () => {
        await sendLog('ErrorPage unknown error')
      })()
      setSendError(false)
    }
  }, [sendError, sendLog, setSendError])

  if (isRouteErrorResponse(error)) {
    // error is type `ErrorResponse`
    errorMessage = error.statusText
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else {
    setSendError(true)
    errorMessage = 'Unknown error'
  }

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
