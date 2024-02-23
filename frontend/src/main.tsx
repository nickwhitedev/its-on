import './index.css'

import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AppContextProvider from './contexts/AppContextProvider'
import router from './routes/router'
import { baseUrl } from './utils/urls'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}
const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: window.matchMedia('(prefers-color-scheme: dark)').matches
            ? dark
            : undefined,
          layout: {
            termsPageUrl: `${baseUrl}/terms`,
            privacyPageUrl: `${baseUrl}/privacy`,
          },
          variables: {
            colorPrimary: '#17c1e8',
          },
        }}
      >
        <AppContextProvider>
          <RouterProvider router={router} />
        </AppContextProvider>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
