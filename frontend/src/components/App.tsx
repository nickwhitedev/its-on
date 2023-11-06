import './App.css'

import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getFullLoginUrl, getTokens, login } from '../utils/auth'

import { useChannelsDispatch } from '../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../contexts/channels/channelsReducer'
import { useSubscriptionsDispatch } from '../contexts/subscriptions/subscriptionsContext'
import { SubscriptionsDispatchActionType } from '../contexts/subscriptions/subscriptionsReducer'
import { useUser, useUserDispatch } from '../contexts/user/userContext'
import { UserDispatchActionType } from '../contexts/user/userReducer'
import { fetchApi } from '../utils/api'
import { registerNotificationSubscription } from '../utils/notifications'
import ItsOnIcon from './icons/ItsOnIcon'
import MDIcon from './material/MDIcon'
import MDPrimaryTab from './material/tabs/MDPrimaryTab'
import MDTabs from './material/tabs/MDTabs'
import UserSettings from './user/UserSettings'

interface OverviewData {
  channels: IChannel[]
  notificationSubscriptions: { subscriptions: Record<string, PushSubscription> }
  profile: IUser
  subscriptions: IChannel[]
}

const params = new URL(document.location.toString()).searchParams
const code = params.get('code')
const state = params.get('state')
const tokens = getTokens()

const App = () => {
  const [authenticated, setAuthenticated] = useState(tokens !== null)
  const [authenticating, setAuthenticating] = useState(code !== null)
  const [loginUrl, setLoginUrl] = useState('')

  const user = useUser()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const dispatchUser = useUserDispatch()

  const navigate = useNavigate()
  const location = useLocation()

  const isChannelsRoute = location.pathname.startsWith('/channels')
  const isSubscriptionsRoute = location.pathname.startsWith('/subscriptions')

  const syncOverview = useCallback(async () => {
    try {
      const response = await fetchApi<OverviewData>('/')

      dispatchChannels({
        type: ChannelsDispatchActionType.SYNCED,
        channels: response.channels,
      })
      dispatchSubscriptions({
        type: SubscriptionsDispatchActionType.SYNCED,
        channels: response.subscriptions,
      })
      dispatchUser({
        type: UserDispatchActionType.SYNCED,
        user: {
          ...response.profile,
          notificationSubscriptions:
            response.notificationSubscriptions.subscriptions,
        },
      })
    } catch (error) {
      // TODO: handle overview fetch error
      // Log error to backend
      // Show user-friendly message
    }
  }, [dispatchChannels, dispatchSubscriptions, dispatchUser])

  useEffect(() => {
    const setFullLoginUrl = async () => {
      const fullLoginUrl = await getFullLoginUrl()
      setLoginUrl(fullLoginUrl)
    }

    const finishLogin = async () => {
      window.history.replaceState({}, document.title, '/')
      try {
        await login(code, state)
        setAuthenticated(true)
      } catch (err) {
        // TODO: Login error handling
      }
      setAuthenticating(false)
    }

    void setFullLoginUrl()
    if (code !== null && state !== null) {
      void finishLogin()
    }
    if (authenticated) void syncOverview()
  }, [authenticated, syncOverview])

  useEffect(() => {
    if (
      authenticated &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      (user?.notificationsEnabled ?? true)
    ) {
      void registerNotificationSubscription({
        registeredNotificationSubscriptions:
          user?.notificationSubscriptions ?? {},
      })
    }
  }, [
    authenticated,
    user?.notificationSubscriptions,
    user?.notificationsEnabled,
  ])

  const getContent = () => {
    if (authenticating) {
      return <div>authenticating...</div>
    }
    if (!authenticated && loginUrl !== '') {
      return <a href={loginUrl}>Log in</a>
    }
    return (
      <>
        <MDTabs
          className='App-nav'
          onChange={event => {
            const activeTabIndex = (
              event.target as { activeTabIndex: number } | null
            )?.activeTabIndex
            navigate(
              activeTabIndex === 0
                ? '/channels'
                : activeTabIndex === 1
                ? '/'
                : '/subscriptions',
            )
          }}
        >
          <MDPrimaryTab active={isChannelsRoute}>Channels</MDPrimaryTab>
          <MDPrimaryTab
            active={!isChannelsRoute && !isSubscriptionsRoute}
            iconOnly
            aria-label={'Home'}
          >
            <MDIcon>
              <ItsOnIcon />
            </MDIcon>
          </MDPrimaryTab>
          <MDPrimaryTab active={isSubscriptionsRoute}>
            Subscriptions
          </MDPrimaryTab>
        </MDTabs>
        <div className='App-content'>
          <Outlet />
        </div>
      </>
    )
  }

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>It&apos;s On</h1>
        {!authenticating && authenticated && loginUrl !== '' ? (
          <UserSettings className='App-settings' />
        ) : null}
      </header>
      <main className='App-main'>{getContent()}</main>
    </div>
  )
}

export default App
