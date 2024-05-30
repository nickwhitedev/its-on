import './index.css'

import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AppContextProvider from './contexts/AppContextProvider'
import router from './routes/router'
import { BASE_URL } from './utils/urls'
import { CLERK_PUBLISHABLE_KEY, useDarkTheme } from './utils/constants'

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}
const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: useDarkTheme ? dark : undefined,
          layout: {
            helpPageUrl: `${BASE_URL}/support`,
            termsPageUrl: `${BASE_URL}/terms`,
            privacyPageUrl: `${BASE_URL}/privacy`,
          },
          variables: {
            colorPrimary: '#17c1e8',
            colorNeutral: useDarkTheme ? '#e2e2e2' : '#1b1b1b',
          },
        }}
        supportEmail='support@itson.fyi'
      >
        <AppContextProvider>
          <RouterProvider router={router} />
        </AppContextProvider>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
