import { createBrowserRouter } from 'react-router-dom'
import App from '../components/App.react'
import ErrorPage from '../components/errors/ErrorPage.react'
import appRouter from './app/appRouter'

export default createBrowserRouter([
  {
    children: appRouter,
    element: <App />,
    errorElement: <ErrorPage />,
    path: '/',
  },
])
