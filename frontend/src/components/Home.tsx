import PullToRefresh from 'pulltorefreshjs'
import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useChannelsDispatch } from '../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../contexts/channels/channelsReducer'
import { useSubscriptionsDispatch } from '../contexts/subscriptions/subscriptionsContext'
import { SubscriptionsDispatchActionType } from '../contexts/subscriptions/subscriptionsReducer'
import { useUser, useUserDispatch } from '../contexts/user/userContext'
import { UserDispatchActionType } from '../contexts/user/userReducer'
import { fetchApi } from '../utils/api'
import client from '../utils/client'
import { registerNotificationSubscription } from '../utils/notifications'
import ItsOnIcon from './icons/ItsOnIcon'
import MDIcon from './material/MDIcon'
import MDCircularProgress from './material/progress/MDCircularProgress'
import MDPrimaryTab from './material/tabs/MDPrimaryTab'
import MDTabs from './material/tabs/MDTabs'

interface OverviewData {
  channels?: IChannel[]
  notificationSubscriptions?: {
    subscriptions: Record<string, PushSubscription>
  }
  profile: IUser
  subscriptions?: IChannel[]
}

const Home = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasOverviewError, setHasOverviewError] = useState<boolean>(false)

  const userContext = useUser()

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
      setHasOverviewError(true)
    }
    setIsLoading(false)
  }, [dispatchChannels, dispatchSubscriptions, dispatchUser])

  useEffect(() => {
    if (
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
    isLoading,
    userContext?.notificationSubscriptions,
    userContext?.notificationsEnabled,
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
    void syncOverview()
  }, [syncOverview])

  return (
    <>
      <MDTabs
        className='Home-nav'
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
        <MDPrimaryTab active={isSubscriptionsRoute}>Subscriptions</MDPrimaryTab>
      </MDTabs>
      <div className='Home-content'>
        {isLoading ? (
          <MDCircularProgress
            className='Home-loading'
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
}

export default Home
