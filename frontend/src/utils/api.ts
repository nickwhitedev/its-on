/** @module utils/api */

import { getTokens, refreshTokens } from './auth'

import { APIError } from './errors/apiError'
import { apiUrl } from './urls'

/**
 * Fetches an its-on api endpoint.
 * @param {string} uri - The endpoint uri.
 * @param {string} method - The HTTP method to be used.
 * @param {Object} [body] - The request body.
 * @return {Response} The API response.
 */
const fetchApiCall = async (
  uri: string,
  method: string,
  body?: object,
): Promise<Response> =>
  await fetch(`${apiUrl}${uri}`, {
    ...(body != null ? { body: JSON.stringify(body) } : {}),
    headers: {
      Authorization: `Bearer ${getTokens()?.idToken}`,
      'Content-Type': 'application/json',
    },
    method,
  })

/**
 * Fetches an its-on api endpoint, retrying if 401 received.
 * @param {string} uri - The endpoint uri.
 * @param {string} [method=GET] - The HTTP method to be used.
 * @param {Object} [body] - The request body.
 * @param {boolean} [noRefresh] - Whether the request should refresh tokens if 401
 * @return {object} The API response.
 */
export const fetchApi = async <T>(
  uri: string,
  method = 'GET',
  body?: object,
  noRefresh = false,
): Promise<T> => {
  const response = await fetchApiCall(uri, method, body)
  if (!response.ok) {
    if (response.status !== 401 || noRefresh) {
      throw new APIError({
        cause: { responseCode: response.status },
        message: 'Bad response',
        name: 'REQUEST_FAILED',
      })
    }

    // refresh tokens and retry
    await refreshTokens(getTokens()?.refreshToken ?? '')
    return await fetchApi(uri, method, body, true)
  }
  // JSON.parse throws an error when the response is empty, so check for it
  const responseString = await response.text()
  const parsedResponse = (
    responseString === '' ? {} : JSON.parse(responseString)
  ) as T
  return parsedResponse
}
