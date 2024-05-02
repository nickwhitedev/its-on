import React, { useEffect } from 'react'
import { useUser } from '../../contexts/user/userContext'
import {
  STRIPE_10_OWNED_DARK_PRICING_TABLE_ID,
  STRIPE_10_OWNED_LIGHT_PRICING_TABLE_ID,
  STRIPE_25_OWNED_DARK_PRICING_TABLE_ID,
  STRIPE_25_OWNED_LIGHT_PRICING_TABLE_ID,
  STRIPE_ALL_OWNED_DARK_PRICING_TABLE_ID,
  STRIPE_ALL_OWNED_LIGHT_PRICING_TABLE_ID,
  STRIPE_BASE_DARK_PRICING_TABLE_ID,
  STRIPE_BASE_LIGHT_PRICING_TABLE_ID,
  STRIPE_PUBLIC_KEY,
  TIER_10,
  TIER_100,
  TIER_25,
  TIER_5,
  TIER_INFINITE,
  useDarkTheme,
} from '../../utils/constants'

const renderPricingTable = (tableID: string) => {
  return React.createElement('stripe-pricing-table', {
    'pricing-table-id': tableID,
    'publishable-key': STRIPE_PUBLIC_KEY,
  })
}

/**
 * React wrapper for stripe-pricing-table
 */
const StripePricingTable = () => {
  const user = useUser()

  const currentTier = user?.tier ?? TIER_5

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/pricing-table.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (currentTier === TIER_INFINITE || currentTier >= TIER_100) {
    return renderPricingTable(
      useDarkTheme
        ? STRIPE_ALL_OWNED_DARK_PRICING_TABLE_ID
        : STRIPE_ALL_OWNED_LIGHT_PRICING_TABLE_ID,
    )
  } else if (currentTier >= TIER_25) {
    return renderPricingTable(
      useDarkTheme
        ? STRIPE_25_OWNED_DARK_PRICING_TABLE_ID
        : STRIPE_25_OWNED_LIGHT_PRICING_TABLE_ID,
    )
  } else if (currentTier >= TIER_10) {
    return renderPricingTable(
      useDarkTheme
        ? STRIPE_10_OWNED_DARK_PRICING_TABLE_ID
        : STRIPE_10_OWNED_LIGHT_PRICING_TABLE_ID,
    )
  } else {
    return renderPricingTable(
      useDarkTheme
        ? STRIPE_BASE_DARK_PRICING_TABLE_ID
        : STRIPE_BASE_LIGHT_PRICING_TABLE_ID,
    )
  }
}

export default StripePricingTable
