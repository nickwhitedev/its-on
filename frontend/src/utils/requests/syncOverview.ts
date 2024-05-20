import { useCallback } from 'react'
import { useFetchApi } from '../api'
import { useChannelsDispatch } from '../../contexts/channels/channelsContext'
import { useSubscriptionsDispatch } from '../../contexts/subscriptions/subscriptionsContext'
import { useUserDispatch } from '../../contexts/user/userContext'
import { ChannelsDispatchActionType } from '../../contexts/channels/channelsReducer'
import { SubscriptionsDispatchActionType } from '../../contexts/subscriptions/subscriptionsReducer'
import { UserDispatchActionType } from '../../contexts/user/userReducer'

interface OverviewData {
  channels?: IChannel[]
  notificationSubscriptions?: {
    subscriptions: Record<string, PushSubscription>
  }
  profile: IUser
  subscriptions?: IChannel[]
}

export const useSyncOverview = (): (() => Promise<void>) => {
  const fetchApi = useFetchApi()
  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const dispatchUser = useUserDispatch()

  return useCallback(async () => {
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
      user: response.profile,
    })
  }, [dispatchChannels, dispatchSubscriptions, dispatchUser, fetchApi])
}
