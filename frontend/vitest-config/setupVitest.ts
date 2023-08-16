import '@testing-library/jest-dom'
import crypto from 'crypto'
import { TextEncoder } from 'util'
import { vi } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import { PKCE_STATE_KEY, PKCE_VERIFIER_KEY } from '../src/utils/constants'

global.TextEncoder = TextEncoder

Object.defineProperty(global.self, 'crypto', {
  value: {
    subtle: crypto.webcrypto.subtle,
  },
})

const fetchMocker = createFetchMock(vi)

// sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks()

window.localStorage.setItem(PKCE_STATE_KEY, 'some-state')
window.localStorage.setItem(PKCE_VERIFIER_KEY, 'some-verifier')
