import { useAuth } from '@clerk/clerk-react'
import { APIError } from './errors/apiError'
import { apiUrl } from './urls'

/**
 * Hook for fetching an its-on api endpoint.
 */
export const useFetchApi = (): (<T>(
  uri: string,
  method?: string,
  body?: object,
) => Promise<T>) => {
  const { getToken } = useAuth()

  return async <T>(uri: string, method = 'GET', body?: object) => {
    const response = await fetch(`${apiUrl}${uri}`, {
      ...(body != null ? { body: JSON.stringify(body) } : {}),
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        'Content-Type': 'application/json',
      },
      method,
    })

    if (!response.ok) {
      throw new APIError({
        cause: { responseCode: response.status },
        message: 'Bad response',
        name: 'REQUEST_FAILED',
      })
    }
    // JSON.parse throws an error when the response is empty, so check for it
    const responseString = await response.text()
    const parsedResponse = (
      responseString === '' ? {} : JSON.parse(responseString)
    ) as T
    return parsedResponse
  }
}
