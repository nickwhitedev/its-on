import { fetchAuthSession } from 'aws-amplify/auth'

import { APIError } from './errors/apiError'
import { apiUrl } from './urls'

/**
 * Fetches an its-on api endpoint.
 */
export const fetchApi = async <T>(
  uri: string,
  method = 'GET',
  body?: object,
): Promise<T> => {
  const response = await fetch(`${apiUrl}${uri}`, {
    ...(body != null ? { body: JSON.stringify(body) } : {}),
    headers: {
      Authorization: `Bearer ${(
        await fetchAuthSession()
      ).tokens?.idToken?.toString()}`,
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
