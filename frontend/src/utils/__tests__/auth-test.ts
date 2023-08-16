import { FetchMock } from 'jest-fetch-mock'
import {
  getFullLoginUrl,
  getTokens,
  login,
  logout,
  refreshTokens,
} from '../auth'
import { PKCE_STATE_KEY, PKCE_VERIFIER_KEY } from '../constants'
import { pkceChallengeFromVerifier } from '../crypto'
import { baseUrl, loginUrl } from '../urls'

const fetchMock = fetch as FetchMock

describe('auth', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    localStorage.clear()
    localStorage.setItem(PKCE_STATE_KEY, 'some-state')
    localStorage.setItem(PKCE_VERIFIER_KEY, 'some-verifier')
  })

  it('should return a valid login URL', async () => {
    const verifier = window.localStorage.getItem(PKCE_VERIFIER_KEY) ?? ''
    const challenge = await pkceChallengeFromVerifier(verifier)
    const fullLoginUrl = await getFullLoginUrl()
    expect(fullLoginUrl).toBe(
      `${loginUrl}?response_type=code&redirect_uri=${baseUrl}/&scope=phone+email+openid+profile&client_id=${
        process.env.VITE_COGNITO_CLIENT_ID
      }&code_challenge_method=S256&code_challenge=${challenge}&state=${window.localStorage.getItem(
        PKCE_STATE_KEY,
      )}`,
    )
  })

  it('should login successfully', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        access_token: 'some-access-token',
        id_token: 'some-id-token',
        refresh_token: 'some-refresh-token',
      }),
    )

    const code = 'some-code'
    const state = 'some-state'
    await login(code, state)

    const tokens = getTokens()
    expect(tokens).toBeDefined()
    expect(tokens?.accessToken).toBe('some-access-token')
    expect(tokens?.idToken).toBe('some-id-token')
    expect(tokens?.refreshToken).toBe('some-refresh-token')
  })

  it('should refresh tokens successfully', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        access_token: 'some-access-token',
        id_token: 'some-id-token',
      }),
    )

    const refreshToken = 'some-refresh-token'
    await refreshTokens(refreshToken)

    const tokens = getTokens()
    expect(tokens).toBeDefined()
    expect(tokens?.accessToken).toBe('some-access-token')
    expect(tokens?.idToken).toBe('some-id-token')
    expect(tokens?.refreshToken).toBe('some-refresh-token')
  })

  it('should logout successfully', () => {
    logout()
    expect(getTokens()).toBeNull()
  })
})
