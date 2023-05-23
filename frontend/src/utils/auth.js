/**
 * Implements PKCE auth
 * 
 * https://codeburst.io/oauth-2-0-authorization-code-grant-flow-with-pkce-for-web-applications-by-example-4dbcc089e805
 * https://developer.okta.com/blog/2019/05/01/is-the-oauth-implicit-flow-dead
 * https://datatracker.ietf.org/doc/html/rfc7636
 */

import { baseUrl, loginUrl, logoutUrl, tokenUrl } from "../urls";
import { generateRandomString, pkceChallengeFromVerifier } from "./crypto";

const cognitoClientID = process.env.REACT_APP_COGNITO_CLIENT_ID;

const accessToken = window.localStorage.getItem('accessToken');
const idToken = window.localStorage.getItem('idToken');
const refreshToken = window.localStorage.getItem('refreshToken');
let tokens = accessToken === null ? null : {
  accessToken,
  idToken,
  refreshToken,
};

// Create and store a random "state" value
let storedPkceState = window.localStorage.getItem('pkceState');
if (storedPkceState === null) {
  const newPkceState = generateRandomString();
  window.localStorage.setItem('pkceState', newPkceState);
  storedPkceState = newPkceState;
}
const pkceState = storedPkceState;

// Create and store a new PKCE code_verifier (the plaintext random secret)
let storedPkceVerifier = window.localStorage.getItem('pkceVerifier');
if (storedPkceVerifier === null) {
  const newVerifier = generateRandomString();
  window.localStorage.setItem('pkceVerifier', newVerifier);
  storedPkceVerifier = newVerifier;
}
const pkceVerifier = storedPkceVerifier;

export const refreshTokens = async refreshToken => {
  const body = `grant_type=refresh_token&refresh_token=${refreshToken
    }&client_id=${cognitoClientID}`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    // TODO: Login error handling
    throw Error();
  }
  const { access_token, id_token } = await response.json();
  window.localStorage.setItem('accessToken', access_token);
  window.localStorage.setItem('idToken', id_token);
  window.localStorage.setItem('refreshToken', refreshToken);
  tokens = {
    accessToken,
    idToken,
    refreshToken,
  };
};

export const getFullLoginUrl = async () => {
  const challenge = await pkceChallengeFromVerifier(pkceVerifier);
  return `${loginUrl}?response_type=code&redirect_uri=${baseUrl
    }/&scope=phone+email+openid+profile&client_id=${cognitoClientID
    }&code_challenge_method=S256&code_challenge=${challenge
    }&state=${storedPkceState}`;
}

export const login = async (code, state) => {
  if (state !== pkceState) {
    // TODO: Login error handling
    throw Error();
  }
  const body = `grant_type=authorization_code&client_id=${cognitoClientID
    }&code_verifier=${pkceVerifier
    }&redirect_uri=${baseUrl
    }/&code=${code}`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    // TODO: Login error handling
    throw Error();
  }
  const { access_token, id_token, refresh_token } = await response.json();
  window.localStorage.setItem('accessToken', access_token);
  window.localStorage.setItem('idToken', id_token);
  window.localStorage.setItem('refreshToken', refresh_token);
  tokens = {
    accessToken: access_token,
    idToken: id_token,
    refreshToken: refresh_token,
  };
};

export const fullLogoutUrl = `${logoutUrl}?logout_uri=${baseUrl
  }/&client_id=${cognitoClientID
  }`

export const logout = async () => {
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('idToken');
  window.localStorage.removeItem('refreshToken');
  tokens = null;
};

export const getTokens = () => tokens;
