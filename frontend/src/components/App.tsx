import '@aws-amplify/ui-react/styles.css'
import './App.css'

import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useError } from '../contexts/error/errorContext'
import { useUser, useUserDispatch } from '../contexts/user/userContext'

import { Amplify } from 'aws-amplify'
import PullToRefresh from 'pulltorefreshjs'
import { useChannelsDispatch } from '../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../contexts/channels/channelsReducer'
import { useSubscriptionsDispatch } from '../contexts/subscriptions/subscriptionsContext'
import { SubscriptionsDispatchActionType } from '../contexts/subscriptions/subscriptionsReducer'
import { UserDispatchActionType } from '../contexts/user/userReducer'
import { fetchApi } from '../utils/api'
import client from '../utils/client'
import { registerNotificationSubscription } from '../utils/notifications'
import ErrorSnackbar from './errors/ErrorSnackbar'
import ItsOnIcon from './icons/ItsOnIcon'
import MDIcon from './material/MDIcon'
import MDCircularProgress from './material/progress/MDCircularProgress'
import MDPrimaryTab from './material/tabs/MDPrimaryTab'
import MDTabs from './material/tabs/MDTabs'
import Notifications from './notifications/Notifications'
import UserSettings from './user/UserSettings'

import { useAuthenticator } from '@aws-amplify/ui-react'
import amplifyConfig from '../amplifyConfig'
import MDRipple from './material/MDRipple'

Amplify.configure(amplifyConfig)

interface OverviewData {
  channels?: IChannel[]
  notificationSubscriptions?: {
    subscriptions: Record<string, PushSubscription>
  }
  profile: IUser
  subscriptions?: IChannel[]
}

const App = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasOverviewError, setHasOverviewError] = useState<boolean>(false)
  const [isOn, setIsOn] = useState<boolean>(false)

  const userContext = useUser()
  const error = useError()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const dispatchUser = useUserDispatch()

  const navigate = useNavigate()
  const location = useLocation()

  const { authStatus, signOut } = useAuthenticator(context => [
    context.authStatus,
  ])

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
      setHasOverviewError(true)
    }
    setIsLoading(false)
  }, [dispatchChannels, dispatchSubscriptions, dispatchUser])

  useEffect(() => {
    if (
      authStatus === 'authenticated' &&
      !isLoading &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      (userContext?.notificationsEnabled ?? true)
    ) {
      void registerNotificationSubscription({
        registeredNotificationSubscriptions:
          userContext?.notificationSubscriptions ?? {},
      })
    }
  }, [
    authStatus,
    isLoading,
    userContext?.notificationSubscriptions,
    userContext?.notificationsEnabled,
  ])

  useEffect(() => {
    if (
      authStatus === 'authenticated' &&
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
  }, [authStatus, syncOverview])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void syncOverview()
    }
  }, [authStatus, syncOverview])

  const getContent = useCallback(() => {
    if (authStatus === 'configuring') {
      return <div>Loading...</div>
    }
    if (authStatus === 'unauthenticated') {
      return (
        <div className='App-about'>
          <button
            aria-label={isOn ? 'Turn off channel' : 'Turn on channel'}
            className={`App-button ${isOn ? 'on' : ''}`}
            onClick={() => {
              setIsOn(prev => !prev)
            }}
          >
            <MDRipple />
            <ItsOnIcon className='App-button-image' />
          </button>
          <h2>Coming Soon</h2>
          <p>
            It&apos;s On is an app for spontaneous low-key invites to your
            social circles for any activity.
          </p>
          <p>
            If you have a group that you regularly see, call, or hang out with,
            It&apos;s On provides an easy way to let them know you&apos;re ready
            for activities.
          </p>
          <p>
            Invite people to your circles and they will know when It&apos;s On!
          </p>
        </div>
      )
    }
    return (
      <>
        <MDTabs
          className='App-nav'
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
        <div className='App-content'>
          {isLoading ? (
            <MDCircularProgress
              className='App-loading'
              indeterminate
            />
          ) : hasOverviewError ? (
            <div>
              <p>Something went wrong...</p>
              <p>Try again later.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </>
    )
  }, [
    authStatus,
    hasOverviewError,
    isChannelsRoute,
    isLoading,
    isOn,
    isSubscriptionsRoute,
    navigate,
  ])

  return (
    <div className='App'>
      <header className='App-header'>
        {authStatus === 'authenticated' ? (
          <Notifications className='App-notifications' />
        ) : null}
        <h1>It&apos;s On</h1>
        {authStatus === 'authenticated' ? (
          <UserSettings
            className='App-settings'
            onSignOut={signOut}
          />
        ) : null}
      </header>
      <main className='App-main'>{getContent()}</main>
      {error.isVisible ? <ErrorSnackbar>{error.message}</ErrorSnackbar> : null}
    </div>
  )
}

export default App
