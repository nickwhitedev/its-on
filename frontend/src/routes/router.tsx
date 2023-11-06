import App from '../components/App'
import ErrorPage from '../components/errors/ErrorPage'
import appRouter from './app/appRouter'
import { createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
    children: appRouter,
    element: <App />,
    errorElement: <ErrorPage />,
    path: '/',
  },
])

export default router
