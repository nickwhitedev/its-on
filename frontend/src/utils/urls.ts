export const baseUrl = import.meta.env.VITE_BASE_URL as string

export const apiUrl = import.meta.env.VITE_API_URL as string

const authUrl = import.meta.env.VITE_AUTH_URL as string

export const tokenUrl = `${authUrl}/oauth2/token`

export const loginUrl = `${authUrl}/oauth2/authorize`

export const logoutUrl = `${authUrl}/logout`
