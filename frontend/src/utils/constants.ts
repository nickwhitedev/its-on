export const UPDATES_CHANNEL_ID = import.meta.env
  .VITE_UPDATES_CHANNEL_ID as string

export const CLERK_PUBLISHABLE_KEY = import.meta.env
  .VITE_CLERK_PUBLISHABLE_KEY as string

export const STRIPE_PUBLIC_KEY = import.meta.env
  .VITE_STRIPE_PUBLIC_KEY as string

export const STRIPE_ALL_OWNED_LIGHT_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_ALL_OWNED_LIGHT_PRICING_TABLE_ID as string
export const STRIPE_25_OWNED_LIGHT_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_25_OWNED_LIGHT_PRICING_TABLE_ID as string
export const STRIPE_10_OWNED_LIGHT_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_10_OWNED_LIGHT_PRICING_TABLE_ID as string
export const STRIPE_BASE_LIGHT_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_BASE_LIGHT_PRICING_TABLE_ID as string

export const STRIPE_ALL_OWNED_DARK_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_ALL_OWNED_DARK_PRICING_TABLE_ID as string
export const STRIPE_25_OWNED_DARK_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_25_OWNED_DARK_PRICING_TABLE_ID as string
export const STRIPE_10_OWNED_DARK_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_10_OWNED_DARK_PRICING_TABLE_ID as string
export const STRIPE_BASE_DARK_PRICING_TABLE_ID = import.meta.env
  .VITE_STRIPE_BASE_DARK_PRICING_TABLE_ID as string

export const ACCESS_TOKEN_KEY = 'accessToken'
export const ID_TOKEN_KEY = 'idToken'
export const REFRESH_TOKEN_KEY = 'refreshToken'

export const PKCE_STATE_KEY = 'pkceState'
export const PKCE_VERIFIER_KEY = 'pkceVerifier'

export const TIER_INFINITE = -1
export const TIER_5 = 5
export const TIER_10 = 10
export const TIER_25 = 25
export const TIER_100 = 100

export const useDarkTheme = window.matchMedia(
  '(prefers-color-scheme: dark)',
).matches
