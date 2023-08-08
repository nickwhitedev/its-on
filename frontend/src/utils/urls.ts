export const baseUrl = process.env.REACT_APP_BASE_URL;

export const apiUrl = process.env.REACT_APP_API_URL;

const authUrl = process.env.REACT_APP_AUTH_URL;

export const tokenUrl = `${authUrl}/oauth2/token`;

export const loginUrl = `${authUrl}/oauth2/authorize`;

export const logoutUrl = `${authUrl}/logout`;
