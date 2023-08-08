import { createBrowserRouter } from 'react-router-dom'
import App from '../components/App'
import ErrorPage from '../components/errors/ErrorPage'
import appRouter from './app/appRouter'

const router = createBrowserRouter([
  {
    children: appRouter,
    element: <App />,
    errorElement: <ErrorPage />,
    path: '/',
  },
])

export default router
