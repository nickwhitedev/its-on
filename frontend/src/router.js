import { createBrowserRouter } from 'react-router-dom'
import App from './components/App.react'
import appRouter from './components/appRouter'
import ErrorPage from './components/errors/ErrorPage.react'

export default createBrowserRouter([
  {
    children: appRouter,
    element: <App />,
    errorElement: <ErrorPage />,
    path: '/',
  },
])
