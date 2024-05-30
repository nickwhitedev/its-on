import './Channel.css'

import Countdown, { zeroPad } from 'react-countdown'
import {
  DEFAULT_USER_TIER,
  channelOnExpirationTime,
  durationOptions,
  isChannelOn,
} from './channelUtils'
import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import { useEffect, useState } from 'react'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'
import { useUser, useUserDispatch } from '../../../contexts/user/userContext'

import ChannelHeader from './ChannelHeader'
import ChannelNote from './ChannelNote'
import ChannelSubscribers from './subscribers/ChannelSubscribers'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { ErrorDispatchActionType } from '../../../contexts/error/errorReducer'
import ItsOnIcon from '../../icons/ItsOnIcon'
import MDCircularProgress from '../../material/progress/MDCircularProgress'
import MDFilledButton from '../../material/button/MDFilledButton'
import MDFilledTonalButton from '../../material/button/MDFilledTonalButton'
import MDRipple from '../../material/MDRipple'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { UserDispatchActionType } from '../../../contexts/user/userReducer'
import { useErrorDispatch } from '../../../contexts/error/errorContext'
import { useFetchApi } from '../../../utils/api'
import { useLocation } from 'react-router-dom'
import { useRequestNotificationPermissions } from '../../../utils/notifications'
import { useSendLog } from '../../../utils/logging'
import EditChannel from './EditChannel'
import DeleteChannelButton from './DeleteChannelButton'
import MDIcon from '../../material/MDIcon'
import MDTextButton from '../../material/button/MDTextButton'
import { UPGRADE_PATH } from '../../../utils/urls'

interface Props {
  channelID: string
}

const Channel = ({ channelID }: Props) => {
  const { pathname } = useLocation()
  const fetchApi = useFetchApi()
  const requestNotificationPermissions = useRequestNotificationPermissions()
  const sendLog = useSendLog()

  const channels = useChannels()
  const subscriptions = useSubscriptions()
  const user = useUser()

  const dispatchChannels = useChannelsDispatch()
  const dispatchError = useErrorDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const dispatchUser = useUserDispatch()

  const prefetchedChannel =
    channels.find(chan => chan.id === channelID) ??
    subscriptions.find(chan => chan.id === channelID) ??
    null

  const [channel, setChannel] = useState<IChannel | null>(prefetchedChannel)

  const userIsChannelOwner = channels.some(ch => ch.id === channelID)

  // null means initial load hasn't started yet
  const [isLoading, setIsLoading] = useState<boolean | null>(null)
  const [isReloading, setIsReloading] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(
    userIsChannelOwner && !channel?.title,
  )
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const [isOn, setIsOn] = useState<boolean>(false)
  const expirationTime = channel == null ? 0 : channelOnExpirationTime(channel)

  const isChannelFull =
    (channel?.subscriberCount ?? 0) >= (channel?.capacity ?? DEFAULT_USER_TIER)

  const userHasMaxSubscriptions =
    !(user?.unlimited ?? false) &&
    (user?.subscriptionCount ?? 0) >= (user?.tier ?? DEFAULT_USER_TIER)

  const channelIsOn = channel != null && isChannelOn(channel)
  const channelIsLoading = isLoading !== false

  useEffect(() => {
    // Set page title
    if (channel?.title != null && channel.owner != null && pathname !== '/') {
      document.title = `It's On - ${channel.title} by ${channel.owner}`
    } else {
      document.title = "It's On"
    }
    return () => {
      document.title = "It's On"
    }
  }, [channel, pathname])

  useEffect(() => {
    // fetch channel
    if (isLoading !== null && !isReloading) return
    setIsLoading(true)
    void (async () => {
      let fetchedChannel: IChannel | null
      try {
        fetchedChannel = await fetchApi<IChannel>(`/${channelID}`)
      } catch (error) {
        fetchedChannel = null
        if (
          (error as { cause?: { responseCode?: number } }).cause
            ?.responseCode !== 404
        ) {
          await sendLog('Fetch channel error', { error }, 'ERROR')
          dispatchError({
            type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
          })
        }
      }
      if (fetchedChannel != null && channelID in channels) {
        // User owns channel
        dispatchChannels({
          type: ChannelsDispatchActionType.CHANGED,
          channel: fetchedChannel,
        })
      } else if (fetchedChannel != null && channelID in subscriptions) {
        // User is subscribed to the channel
        dispatchSubscriptions({
          type: SubscriptionsDispatchActionType.CHANGED,
          channel: fetchedChannel,
        })
      } else {
        // Channel doesn't exist or is a public channel
        setChannel(fetchedChannel)
      }
      setIsLoading(false)
      setIsReloading(false)
    })()
  }, [
    channel?.duration,
    channel?.note,
    channel?.title,
    channelID,
    channels,
    dispatchChannels,
    dispatchError,
    dispatchSubscriptions,
    fetchApi,
    isLoading,
    isReloading,
    sendLog,
    subscriptions,
    user?.tier,
  ])

  useEffect(() => {
    // Sync state with context
    setChannel(
      channels.find(chan => chan.id === channelID) ??
        subscriptions.find(chan => chan.id === channelID) ??
        null,
    )
  }, [channelID, channels, subscriptions])

  useEffect(() => {
    setIsOn(channelIsOn)
  }, [channelIsOn])

  if (channel == null) {
    return channelIsLoading ? (
      <MDCircularProgress className='Channel-loading' indeterminate />
    ) : (
      <h4>Channel not found</h4>
    )
  }

  const handleClickItsOn = async () => {
    if (isOn) {
      return
    }
    dispatchChannels({
      type: ChannelsDispatchActionType.CHANGED,
      channel: {
        ...channel,
        canceled: false,
        lastOn: Date.now(),
        lastOnDuration: channel.duration,
        lastUpdated: Date.now(),
      },
    })
    try {
      await fetchApi(`/${channel.id}/its-on`, 'POST')
    } catch (error) {
      await sendLog("Channel it's on error", { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          canceled: false,
          lastOn: 0,
          lastOnDuration: channel.duration,
          lastUpdated: Date.now(),
        },
      })
    }
  }

  const handleClickCallOff = async () => {
    dispatchChannels({
      type: ChannelsDispatchActionType.CHANGED,
      channel: {
        ...channel,
        canceled: true,
        lastUpdated: Date.now(),
      },
    })
    try {
      await fetchApi(`/${channel.id}/its-off`, 'POST')
    } catch (error) {
      await sendLog("Channel it's off error", { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          canceled: false,
          lastUpdated: Date.now(),
        },
      })
    }
  }

  const handleClickSubscribe = async () => {
    setIsUpdating(true)
    try {
      const { channel: subscribedChannel } = await fetchApi<{
        message: string
        channel: IChannel
      }>(`/${channel.id}/subscribe`, 'POST')
      dispatchSubscriptions({
        type: SubscriptionsDispatchActionType.ADDED,
        channel: subscribedChannel,
      })
      dispatchUser({
        type: UserDispatchActionType.SUBSCRIPTION_COUNT_INCREASED,
      })
    } catch (error) {
      await sendLog('Channel subscribe error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
    setIsUpdating(false)
    setIsReloading(true)

    if (user?.notificationsEnabled ?? true) {
      await requestNotificationPermissions({
        savedNotificationTokens: user?.notificationTokens ?? {},
      })
    }
  }

  const handleClickUnsubscribe = async () => {
    setIsUpdating(true)
    try {
      await fetchApi(`/${channel.id}/unsubscribe`, 'POST')
      dispatchSubscriptions({
        type: SubscriptionsDispatchActionType.DELETED,
        id: channel.id,
      })
      dispatchUser({
        type: UserDispatchActionType.SUBSCRIPTION_COUNT_DECREASED,
      })
    } catch (error) {
      await sendLog('Channel unsubscribe error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
    setIsUpdating(false)
    setIsReloading(true)
  }

  return (
    <div className='Channel'>
      {userIsChannelOwner && isEditing ? (
        <EditChannel
          channel={channel}
          isLoading={channelIsLoading}
          onClose={() => {
            setIsEditing(false)
          }}
        />
      ) : (
        <>
          <ChannelHeader
            channel={channel}
            isUpdating={isUpdating}
            isOn={isOn}
            userIsChannelOwner={userIsChannelOwner}
            setIsEditing={setIsEditing}
          />
          {userIsChannelOwner ? (
            <>
              <button
                aria-label='Turn on channel'
                className={`Channel-button ${isOn ? 'on' : ''}`}
                disabled={isUpdating}
                onClick={() => void handleClickItsOn()}
              >
                <MDRipple />
                <ItsOnIcon className='Channel-button-image' />
              </button>
              <div className='Channel-duration-display'>
                {isOn ? (
                  <>
                    <Countdown
                      date={expirationTime}
                      renderer={({ hours, minutes, seconds }) => (
                        <span>
                          {`${zeroPad(hours)}:${zeroPad(minutes)}`}
                          {hours === 0 && minutes === 0
                            ? `:${zeroPad(seconds)}`
                            : null}
                        </span>
                      )}
                      onComplete={() => {
                        setIsOn(false)
                      }}
                    />
                    <MDFilledTonalButton
                      onClick={() => void handleClickCallOff()}
                    >
                      Call it off
                    </MDFilledTonalButton>
                  </>
                ) : (
                  <div>
                    {durationOptions.find(
                      durationOption =>
                        durationOption.value === channel.duration,
                    )?.displayName ?? '1 Hour'}
                  </div>
                )}
              </div>
              <ChannelNote channel={channel} />
              <ChannelSubscribers
                channel={channel}
                isLoading={channelIsLoading}
                isUpdating={isUpdating}
                setIsUpdating={setIsUpdating}
              />
              <div className='Channel-delete-section'>
                <DeleteChannelButton
                  channel={channel}
                  isUpdating={isUpdating}
                  setIsUpdating={setIsUpdating}
                />
              </div>
            </>
          ) : subscriptions.some(chan => chan.id === channel.id) &&
            channel.deleted !== true ? (
            <>
              <button
                aria-label='Turn on channel'
                className={`Channel-button ${isOn ? 'on' : ''}`}
                disabled={!isOn}
              >
                <ItsOnIcon className='Channel-button-image' />
              </button>
              {isOn ? (
                <div className='Channel-duration-display'>
                  <Countdown
                    date={expirationTime}
                    renderer={({ hours, minutes, seconds }) => (
                      <span>
                        {`${zeroPad(hours)}:${zeroPad(minutes)}`}
                        {hours === 0 && minutes === 0
                          ? `:${zeroPad(seconds)}`
                          : null}
                      </span>
                    )}
                    onComplete={() => {
                      setIsOn(false)
                    }}
                  />
                </div>
              ) : null}
              <ChannelNote channel={channel} />
              <MDFilledTonalButton
                className='Channel-subscribe-button'
                disabled={isUpdating}
                onClick={() => void handleClickUnsubscribe()}
              >
                Unsubscribe
              </MDFilledTonalButton>
            </>
          ) : (
            <>
              <MDFilledButton
                className='Channel-subscribe-button'
                disabled={
                  channelIsLoading ||
                  isUpdating ||
                  isChannelFull ||
                  userHasMaxSubscriptions
                }
                onClick={() => void handleClickSubscribe()}
              >
                {isChannelFull ? 'Channel Full' : 'Subscribe'}
              </MDFilledButton>
              {userHasMaxSubscriptions ? (
                <>
                  <p>Subscription limit reached</p>
                  <p>
                    <MDTextButton href={`/${UPGRADE_PATH}`}>
                      <MDIcon slot='icon'>upgrade</MDIcon>
                      Upgrade
                    </MDTextButton>
                  </p>
                </>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Channel
