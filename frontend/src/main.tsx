import './index.css'

import { ClerkProvider } from '@clerk/clerk-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AppContextProvider from './contexts/AppContextProvider'
import router from './routes/router'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}
const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <AppContextProvider>
          <RouterProvider router={router} />
        </AppContextProvider>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
