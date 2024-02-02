import { LogLevel } from 'vite'
import { useFetchApi } from './api'

export const useSendLog = () => {
  const fetchApi = useFetchApi()

  return async (
    message: string,
    data: Record<string, unknown> = {},
    logLevel: Uppercase<LogLevel> = 'INFO',
  ) => {
    try {
      await fetchApi('/log', 'POST', {
        log: {
          message,
          ...data,
        },
        logLevel,
      })
    } catch {
      return
    }
  }
}
