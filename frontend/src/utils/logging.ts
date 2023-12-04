import { LogLevel } from 'vite'
import { fetchApi } from './api'

export const sendLog = async (
  message: string,
  data: Record<string, unknown> = {},
  logLevel: Uppercase<LogLevel> = 'INFO',
) => {
  try {
    await fetchApi('/channels', 'POST', {
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

export const sendErrorLog = async (
  message: string,
  data: Record<string, unknown> = {},
): Promise<void> => {
  try {
    await fetchApi('/channels', 'POST', {
      log: {
        message,
        ...data,
      },
      logLevel: 'ERROR',
    })
  } catch {
    return
  }
}
