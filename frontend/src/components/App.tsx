import './App.css'

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getFullLoginUrl, getTokens, login } from '../utils/auth'
import { useCallback, useEffect, useState } from 'react'
import { useUser, useUserDispatch } from '../contexts/user/userContext'

import { ChannelsDispatchActionType } from '../contexts/channels/channelsReducer'
import ItsOnIcon from './icons/ItsOnIcon'
import MDCircularProgress from './material/progress/MDCircularProgress'
import MDIcon from './material/MDIcon'
import MDPrimaryTab from './material/tabs/MDPrimaryTab'
import MDTabs from './material/tabs/MDTabs'
import Notifications from './notifications/Notifications'
import PullToRefresh from 'pulltorefreshjs'
import { SubscriptionsDispatchActionType } from '../contexts/subscriptions/subscriptionsReducer'
import { UserDispatchActionType } from '../contexts/user/userReducer'
import UserSettings from './user/UserSettings'
import client from '../utils/client'
import { fetchApi } from '../utils/api'
import { registerNotificationSubscription } from '../utils/notifications'
import { useChannelsDispatch } from '../contexts/channels/channelsContext'
import { useSubscriptionsDispatch } from '../contexts/subscriptions/subscriptionsContext'

interface OverviewData {
  channels?: IChannel[]
  notificationSubscriptions?: {
    subscriptions: Record<string, PushSubscription>
  }
  profile: IUser
  subscriptions?: IChannel[]
}

const params = new URL(document.location.toString()).searchParams
const code = params.get('code')
const state = params.get('state')
const tokens = getTokens()

const App = () => {
  const [authenticated, setAuthenticated] = useState(tokens !== null)
  const [authenticating, setAuthenticating] = useState(code !== null)
  const [loginUrl, setLoginUrl] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const user = useUser()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const dispatchUser = useUserDispatch()

  const navigate = useNavigate()
  const location = useLocation()

  const isChannelsRoute = location.pathname.startsWith('/channels')
  const isSubscriptionsRoute = location.pathname.startsWith('/subscriptions')

  const syncOverview = useCallback(async () => {
    setIsLoading(true)
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
            response.notificationSubscriptions?.subscriptions ?? {},
        },
      })
    } catch (error) {
      // TODO: handle overview fetch error
      // Log error to backend
      // Show user-friendly message
    }
    setIsLoading(false)
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

  useEffect(() => {
    if (
      authenticated &&
      client.isMobileIOS() &&
      (('standalone' in window.navigator && window.navigator.standalone) ||
        window.matchMedia('(display-mode: standalone)').matches)
    ) {
      PullToRefresh.init({
        instructionsPullToRefresh: '',
        instructionsRefreshing: '',
        instructionsReleaseToRefresh: '',
        mainElement: '.App',
        onRefresh() {
          void syncOverview()
        },
      })
    }
  }, [authenticated, syncOverview])

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
          className="App-nav"
          onChange={(event: Event) => {
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
        <div className="App-content">
          {isLoading ? (
            <MDCircularProgress
              className="App-loading"
              indeterminate
            />
          ) : (
            <Outlet />
          )}
        </div>
      </>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        {!authenticating && authenticated && loginUrl !== '' ? (
          <Notifications className="App-notifications" />
        ) : null}
        <h1>It&apos;s On</h1>
        {!authenticating && authenticated && loginUrl !== '' ? (
          <UserSettings className="App-settings" />
        ) : null}
      </header>
      <main className="App-main">{getContent()}</main>
    </div>
  )
}

export default App
