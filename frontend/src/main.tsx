import './index.css'

import { Authenticator } from '@aws-amplify/ui-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AppContextProvider from './contexts/AppContextProvider'
import router from './routes/router'

const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Authenticator.Provider>
        <AppContextProvider>
          <RouterProvider router={router} />
        </AppContextProvider>
      </Authenticator.Provider>
    </React.StrictMode>,
  )
}
