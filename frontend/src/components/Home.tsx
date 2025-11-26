/* eslint-disable react-hooks/set-state-in-effect */
import './Home.css'

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from '../contexts/user/userContext'

import ItsOnIcon from './icons/ItsOnIcon'
import MDCircularProgress from './material/progress/MDCircularProgress'
import MDIcon from './material/MDIcon'
import MDPrimaryTab from './material/tabs/MDPrimaryTab'
import MDTabs from './material/tabs/MDTabs'
import PullToRefresh from 'pulltorefreshjs'
import client from '../utils/client'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { useEnableDeviceNotifications } from '../utils/notifications'
import { useFetchApi } from '../utils/api'
import { useSyncOverview } from '../utils/requests/syncOverview'
import { STANDALONE_PAGE_PATHS } from '../utils/urls'

const Home = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasOverviewError, setHasOverviewError] = useState<boolean>(false)
  const [isEnablingDeviceNotifications, setIsEnablingDeviceNotifications] =
    useState<boolean>(true)

  const userContext = useUser()
  const clerkUser = useClerkUser()

  const navigate = useNavigate()
  const location = useLocation()
  const fetchApi = useFetchApi()
  const enableDeviceNotifications = useEnableDeviceNotifications()

  const syncOverviewRequest = useSyncOverview()

  const isChannelsRoute = location.pathname.startsWith('/channels')
  const isSubscriptionsRoute = location.pathname.startsWith('/subscriptions')

  const syncOverview = useCallback(async () => {
    setIsLoading(true)
    try {
      await syncOverviewRequest()
    } catch {
      setHasOverviewError(true)
    }
    setIsLoading(false)
  }, [syncOverviewRequest])

  useEffect(() => {
    if (!isLoading && isEnablingDeviceNotifications) {
      void enableDeviceNotifications({
        savedNotificationTokens: userContext?.notificationTokens ?? {},
      })
      setIsEnablingDeviceNotifications(false)
    }
  }, [
    isLoading,
    enableDeviceNotifications,
    userContext?.notificationTokens,
    isEnablingDeviceNotifications,
  ])

  useEffect(() => {
    if (
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
  }, [syncOverview])

  useEffect(() => {
    if (isLoading) {
      void syncOverview()
    }
  }, [isLoading, syncOverview])

  useEffect(() => {
    const savedUsername = userContext?.username
    const clerkUsername = clerkUser.user?.username
    if (
      savedUsername != null &&
      clerkUsername != null &&
      savedUsername !== clerkUsername
    ) {
      void fetchApi('/user', 'PUT', { username: clerkUsername })
    }
  }, [clerkUser.user?.username, fetchApi, userContext?.username])

  return (
    <>
      {STANDALONE_PAGE_PATHS.includes(location.pathname.slice(1)) ? null : (
        <MDTabs
          className='Home-nav'
          onChange={(event: Event) => {
            const activeTabIndex = (
              event.target as { activeTabIndex: number } | null
            )?.activeTabIndex
            void navigate(
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
      )}
      <div className='Home-content'>
        {isLoading ? (
          <MDCircularProgress className='Home-loading' indeterminate />
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
}

export default Home
