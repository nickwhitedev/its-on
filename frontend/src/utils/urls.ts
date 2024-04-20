import { UPDATES_CHANNEL_ID } from './constants'

export const baseUrl = import.meta.env.VITE_BASE_URL as string

export const apiUrl = import.meta.env.VITE_API_URL as string

export const updatesChannelUrl = `${baseUrl}/${UPDATES_CHANNEL_ID}`
