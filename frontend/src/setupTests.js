// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import fetchMock from "jest-fetch-mock";
import { TextEncoder } from 'util';
import { PKCE_STATE_KEY, PKCE_VERIFIER_KEY } from './utils/constants';

Object.assign(global, { crypto: webcrypto, TextEncoder });

fetchMock.enableMocks();

window.localStorage.setItem(PKCE_STATE_KEY, 'some-state');
window.localStorage.setItem(PKCE_VERIFIER_KEY, 'some-verifier');
