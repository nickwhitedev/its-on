import Channels from './channels/Channels.react'
import HomeBody from './HomeBody.react'
import Subscriptions from './subscriptions/Subscriptions.react'

const appRouter = [
  {
    element: <HomeBody />,
    index: true,
  },
  {
    element: <Channels />,
    path: 'channels',
  },
  {
    element: <Subscriptions />,
    path: 'subscriptions',
  },
]

export default appRouter
