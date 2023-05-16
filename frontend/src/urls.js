export const baseURL = process.env.REACT_APP_BASE_URL;

const authURL = process.env.REACT_APP_AUTH_URL;

export const loginURL = `${authURL
  }/oauth2/authorize?client_id=${process.env.REACT_APP_COGNITO_CLIENT_ID
  }&response_type=code&scope=email+openid+phone+profile&redirect_uri=${process.env.REACT_APP_BASE_URL
  }/`;
