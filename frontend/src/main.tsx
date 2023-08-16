import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AppContextProvider from './contexts/AppContextProvider'
import './index.css'
import router from './routes/router'

const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppContextProvider>
        <RouterProvider router={router} />
      </AppContextProvider>
    </React.StrictMode>,
  )
}
