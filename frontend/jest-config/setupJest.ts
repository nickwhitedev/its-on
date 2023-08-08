import '@testing-library/jest-dom'
import crypto from 'crypto'
import FetchMock from 'jest-fetch-mock'
import { TextEncoder } from 'util'
import { PKCE_STATE_KEY, PKCE_VERIFIER_KEY } from '../src/utils/constants'

global.TextEncoder = TextEncoder

Object.defineProperty(global.self, 'crypto', {
  value: {
    subtle: crypto.webcrypto.subtle,
  },
})

FetchMock.enableMocks()

// class LocalStorageMock {
//   store: { [key: string]: string }
//   length = 0
//   constructor() {
//     this.store = {}
//   }

//   clear() {
//     this.store = {}
//   }

//   getItem(key: string) {
//     return this.store[key] || null
//   }

//   key(_: number) {
//     return ''
//   }

//   setItem(key: string, value: string) {
//     this.store[key] = value
//   }

//   removeItem(key: string) {
//     delete this.store[key]
//   }
// }

// global.localStorage = new LocalStorageMock()

window.localStorage.setItem(PKCE_STATE_KEY, 'some-state')
window.localStorage.setItem(PKCE_VERIFIER_KEY, 'some-verifier')
