export const baseURL = new URL("/", process.env.REACT_APP_BASE_URL);

const authURL = new URL("/", process.env.REACT_APP_AUTH_URL);

export const loginURL = (() => {
  const loginURL = new URL('/login', authURL);
  loginURL.searchParams.set('client_id', process.env.REACT_APP_COGNITO_CLIENT_ID);
  loginURL.searchParams.set('response_type', 'code');
  loginURL.searchParams.set('scope', 'email+openid+phone+profile');
  loginURL.searchParams.set('redirect_uri', baseURL.href);
  return loginURL;
})();
