import App from '../components/App'
import ErrorPage from '../components/errors/ErrorPage'
import ProfileMenu from '../components/profile/ProfileMenu'
import appRouter from './app/appRouter'
import { createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
    element: <ProfileMenu />,
    errorElement: <ErrorPage />,
    path: '/profile',
  },
  {
    children: appRouter,
    element: <App />,
    errorElement: <ErrorPage />,
    path: '/',
  },
])

export default router
