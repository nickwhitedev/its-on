/** @module utils/api */

import { apiUrl } from '../urls';
import { getTokens, refreshTokens } from './auth';

/**
 * Fetches an its-on api endpoint.
 * @param {string} uri - The endpoint uri.
 * @param {string} method - The HTTP method to be used.
 * @param {Object} [body] - The request body.
 * @return {Response} The API response.
 */
const fetchApiCall = async (uri, method, body) =>
  await fetch(`${apiUrl}${uri}`, {
    ...(body != null ? { body: JSON.stringify(body) } : {}),
    headers: {
      Authorization: `Bearer ${getTokens().idToken}`,
      'Content-Type': 'application/json',
    },
    method,
  });


/**
 * Fetches an its-on api endpoint, retrying if 401 received.
 * @param {string} uri - The endpoint uri.
 * @param {string} [method=GET] - The HTTP method to be used.
 * @param {Object} [body] - The request body.
 * @return {any} The API response.
 */
export const fetchApi = async (uri, method = 'GET', body) => {
  const response = await fetchApiCall(uri, method, body);
  if (!response.ok) {
    if (response.status !== 401) {
      // TODO: API Error handling
      throw new Error();
    }

    // refresh tokens and retry
    await refreshTokens(getTokens().refreshToken);
    const retryResponse = await fetchApiCall(uri, method, body);
    if (!retryResponse.ok) {
      // TODO: API Error handling
      throw new Error();
    }
    return await retryResponse.json();
  }
  return await response.json();
}
