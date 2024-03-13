import React, { useEffect } from 'react'

/**
 * React wrapper for stripe-pricing-table
 */
const StripePricingTable = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/pricing-table.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // TODO: Make another pricing table to handle light/dark... hacky but ok

  return React.createElement('stripe-pricing-table', {
    'pricing-table-id': 'prctbl_1OtLImKtgME2R7hoa474lyu1',
    'publishable-key':
      'pk_test_51ObZsQKtgME2R7hoAnBwFbT7sTfMRzlW7OiYc3ShPhIfOKx6AjemX8ilZUyHnsNpsgnqHSy7Z7xX55QHxRSSXdRK00vFGQb746',
  })
}

export default StripePricingTable
