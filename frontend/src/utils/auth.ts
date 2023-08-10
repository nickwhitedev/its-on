/**
 * Implements PKCE auth
 *
 * https://codeburst.io/oauth-2-0-authorization-code-grant-flow-with-pkce-for-web-applications-by-example-4dbcc089e805
 * https://developer.okta.com/blog/2019/05/01/is-the-oauth-implicit-flow-dead
 * https://datatracker.ietf.org/doc/html/rfc7636
 */

import {
  ACCESS_TOKEN_KEY,
  ID_TOKEN_KEY,
  PKCE_STATE_KEY,
  PKCE_VERIFIER_KEY,
  REFRESH_TOKEN_KEY,
} from './constants'
import { generateRandomString, pkceChallengeFromVerifier } from './crypto'
import { baseUrl, loginUrl, logoutUrl, tokenUrl } from './urls'

const cognitoClientID = process.env.REACT_APP_COGNITO_CLIENT_ID

const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
const idToken = window.localStorage.getItem(ID_TOKEN_KEY)
const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
let tokens =
  accessToken === null
    ? null
    : {
        accessToken,
        idToken,
        refreshToken,
      }

// Create and store a random "state" value
let storedPkceState = window.localStorage.getItem(PKCE_STATE_KEY)
if (storedPkceState === null) {
  const newPkceState = generateRandomString()
  window.localStorage.setItem(PKCE_STATE_KEY, newPkceState)
  storedPkceState = newPkceState
}
const pkceState = storedPkceState

// Create and store a new PKCE code_verifier (the plaintext random secret)
let storedPkceVerifier = window.localStorage.getItem(PKCE_VERIFIER_KEY)
if (storedPkceVerifier === null) {
  const newVerifier = generateRandomString()
  window.localStorage.setItem(PKCE_VERIFIER_KEY, newVerifier)
  storedPkceVerifier = newVerifier
}
const pkceVerifier = storedPkceVerifier

export const refreshTokens = async (refreshToken: string) => {
  const body = `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${cognitoClientID}`
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    // TODO: Login error handling
    throw Error()
  }
  const { access_token, id_token } = (await response.json()) as {
    access_token: string
    id_token: string
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  window.localStorage.setItem(ID_TOKEN_KEY, id_token)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  tokens = {
    accessToken: access_token,
    idToken: id_token,
    refreshToken,
  }
}

export const getFullLoginUrl = async () => {
  const challenge = await pkceChallengeFromVerifier(pkceVerifier)
  return `${loginUrl}?response_type=code&redirect_uri=${baseUrl}/&scope=phone+email+openid+profile&client_id=${cognitoClientID}&code_challenge_method=S256&code_challenge=${challenge}&state=${storedPkceState}`
}

export const login = async (code: string | null, state: string | null) => {
  if (state !== pkceState) {
    // TODO: Login error handling
    throw Error()
  }
  const body = `grant_type=authorization_code&client_id=${cognitoClientID}&code_verifier=${pkceVerifier}&redirect_uri=${baseUrl}/&code=${code}`
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    // TODO: Login error handling
    throw Error()
  }
  const { access_token, id_token, refresh_token } = (await response.json()) as {
    access_token: string
    id_token: string
    refresh_token: string
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  window.localStorage.setItem(ID_TOKEN_KEY, id_token)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  tokens = {
    accessToken: access_token,
    idToken: id_token,
    refreshToken: refresh_token,
  }
}

export const fullLogoutUrl = `${logoutUrl}?logout_uri=${baseUrl}/&client_id=${cognitoClientID}`

export const logout = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(ID_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  tokens = null
}

export const getTokens = () => tokens
