import { UPDATES_CHANNEL_ID } from './constants'

export const BASE_URL = import.meta.env.VITE_BASE_URL as string

export const API_URL = import.meta.env.VITE_API_URL as string

export const UPDATES_CHANNEL_URL = `${BASE_URL}/${UPDATES_CHANNEL_ID}`

export const ABOUT_PATH = 'about'
export const CHANNELS_PATH = 'channels'
export const SUBSCRIPTIONS_PATH = 'subscriptions'
export const PROFILE_PATH = 'profile'
export const TERMS_PATH = 'terms'
export const PRIVACY_PATH = 'privacy'
export const CSAE_PATH = 'csae'
export const SUPPORT_PATH = 'support'
export const UPGRADE_PATH = 'upgrade'
export const UPGRADE_SUCCESS_PATH = 'upgrade_success'

export const STANDALONE_PAGE_PATHS = [
  ABOUT_PATH,
  PROFILE_PATH,
  TERMS_PATH,
  PRIVACY_PATH,
  CSAE_PATH,
  SUPPORT_PATH,
  // UPGRADE_PATH,
  // UPGRADE_SUCCESS_PATH,
]
