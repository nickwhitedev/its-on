import { createBrowserRouter } from 'react-router-dom'
import appRouter from './app/appRouter'

export default createBrowserRouter([
  {
    children: appRouter,
    element: <App />,
    errorElement: <ErrorPage />,
    path: '/',
  },
])
