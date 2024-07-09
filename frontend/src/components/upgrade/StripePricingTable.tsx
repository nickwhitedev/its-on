import React, { useEffect } from 'react'
import {
  STRIPE_10_OWNED_DARK_PRICING_TABLE_ID,
  STRIPE_10_OWNED_LIGHT_PRICING_TABLE_ID,
  STRIPE_25_OWNED_DARK_PRICING_TABLE_ID,
  STRIPE_25_OWNED_LIGHT_PRICING_TABLE_ID,
  STRIPE_BASE_DARK_PRICING_TABLE_ID,
  STRIPE_BASE_LIGHT_PRICING_TABLE_ID,
  STRIPE_PUBLIC_KEY,
  TIER_10,
  TIER_100,
  TIER_25,
  TIER_5,
  useDarkTheme,
} from '../../utils/constants'

import { useUser } from '../../contexts/user/userContext'

const renderPricingTable = ({
  tableID,
  userID,
}: {
  tableID: string
  userID: string
}) => {
  return React.createElement('stripe-pricing-table', {
    'pricing-table-id': tableID,
    'publishable-key': STRIPE_PUBLIC_KEY,
    'client-reference-id': userID,
  })
}

/**
 * React wrapper for stripe-pricing-table
 */
const StripePricingTable = () => {
  const user = useUser()

  const currentTier = user?.tier ?? TIER_5
  const userID = user?.id ?? ''

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/pricing-table.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (user?.unlimited === true || currentTier >= TIER_100) {
    // TODO: Add subscription
    return <h4>You are upgraded to the max! For now, at least. Stay tuned.</h4>
    // return renderPricingTable({
    //   tableID: useDarkTheme
    //     ? STRIPE_ALL_OWNED_DARK_PRICING_TABLE_ID
    //     : STRIPE_ALL_OWNED_LIGHT_PRICING_TABLE_ID,
    //   userID,
    // })
  } else if (currentTier >= TIER_25) {
    return renderPricingTable({
      tableID: useDarkTheme
        ? STRIPE_25_OWNED_DARK_PRICING_TABLE_ID
        : STRIPE_25_OWNED_LIGHT_PRICING_TABLE_ID,
      userID,
    })
  } else if (currentTier >= TIER_10) {
    return renderPricingTable({
      tableID: useDarkTheme
        ? STRIPE_10_OWNED_DARK_PRICING_TABLE_ID
        : STRIPE_10_OWNED_LIGHT_PRICING_TABLE_ID,
      userID,
    })
  } else {
    return renderPricingTable({
      tableID: useDarkTheme
        ? STRIPE_BASE_DARK_PRICING_TABLE_ID
        : STRIPE_BASE_LIGHT_PRICING_TABLE_ID,
      userID,
    })
  }
}

export default StripePricingTable
