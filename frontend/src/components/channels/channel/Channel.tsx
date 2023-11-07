import './Channel.css'

import { useEffect, useState } from 'react'
import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'
import {
  DEFAULT_USER_TIER,
  channelOnProgress,
  durationOptions,
  isChannelOn,
} from './channelUtils'

import { useNavigate } from 'react-router-dom'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { useUser, useUserDispatch } from '../../../contexts/user/userContext'
import { UserDispatchActionType } from '../../../contexts/user/userReducer'
import { fetchApi } from '../../../utils/api'
import { requestNotificationPermissions } from '../../../utils/notifications'
import { MS_IN_HOUR } from '../../../utils/time'
import ItsOnIcon from '../../icons/ItsOnIcon'
import MDDialog from '../../material/MDDialog'
import MDIcon from '../../material/MDIcon'
import MDFilledButton from '../../material/button/MDFilledButton'
import MDFilledTonalButton from '../../material/button/MDFilledTonalButton'
import MDTextButton from '../../material/button/MDTextButton'
import MDLinearProgress from '../../material/progress/MDLinearProgress'
import MDOutlinedSelect from '../../material/select/MDOutlinedSelect'
import MDSelectOption from '../../material/select/MDSelectOption'
import ChannelHeader from './ChannelHeader'
import ChannelNote from './ChannelNote'
import ChannelSubscribers from './subscribers/ChannelSubscribers'

interface Props {
  channel: IChannel
}

const Channel = ({ channel }: Props) => {
  const navigate = useNavigate()

  const channels = useChannels()
  const subscriptions = useSubscriptions()
  const user = useUser()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const dispatchUser = useUserDispatch()

  const userIsChannelOwner = channels.some(ch => ch.id === channel.id)

  const [isEditing, setIsEditing] = useState<boolean>(
    userIsChannelOwner && !channel.title,
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false)

  const [currentCapacity, setCurrentCapacity] = useState<number>(
    user?.tier ?? DEFAULT_USER_TIER,
  )
  const [currentDuration, setCurrentDuration] = useState<number>(
    channel.duration ?? MS_IN_HOUR,
  )
  const [currentNote, setCurrentNote] = useState<string>(channel.note ?? '')
  const [currentTitle, setCurrentTitle] = useState<string>(channel.title ?? '')

  const isOn = isChannelOn(channel)
  const onProgress = channelOnProgress(channel)

  const isChannelFull =
    (channel.subscriberCount ?? 0) >= (channel.capacity ?? DEFAULT_USER_TIER)

  const userHasMaxSubscriptions =
    (user?.subscriptionCount ?? 0) >= (user?.tier ?? DEFAULT_USER_TIER)

  useEffect(() => {
    document.title = channel.title ?? "It's On"
    return () => {
      document.title = "It's On"
    }
  }, [channel])

  const handleClickItsOn = async () => {
    setIsLoading(true)
    try {
      await fetchApi(`/${channel.id}/its-on`, 'POST')
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
    } catch (error) {
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }
    setIsLoading(false)
  }

  const handleResetFormState = () => {
    setCurrentCapacity(user?.tier ?? DEFAULT_USER_TIER)
    setCurrentDuration(channel.duration ?? MS_IN_HOUR)
    setCurrentNote(channel.note ?? '')
    setCurrentTitle(channel.title ?? '')
  }

  const handleSaveUpdates = async () => {
    setIsLoading(true)

    try {
      const channelUpdates = {
        capacity: currentCapacity,
        duration: currentDuration,
        note: currentNote,
        title: currentTitle,
      }
      await fetchApi(`/${channel.id}`, 'PUT', channelUpdates)
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          ...channelUpdates,
        },
      })
    } catch (error) {
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }

    setIsLoading(false)
    setIsEditing(false)
  }

  const handleClickCallOff = async () => {
    setIsLoading(true)
    try {
      await fetchApi(`/${channel.id}/its-off`, 'POST')
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          canceled: true,
          lastUpdated: Date.now(),
        },
      })
    } catch (error) {
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }
    setIsLoading(false)
  }

  const handleClickDelete = () => {
    setIsConfirmingDelete(true)
  }

  const handleConfirmDelete = async () => {
    setIsLoading(true)
    try {
      await fetchApi(`/${channel.id}`, 'DELETE')
      dispatchChannels({
        type: ChannelsDispatchActionType.DELETED,
        id: channel.id,
      })
      dispatchUser({
        type: UserDispatchActionType.CHANNEL_COUNT_DECREASED,
      })
      navigate('/channels')
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    setIsConfirmingDelete(false)
    setIsLoading(false)
  }

  const handleClickSubscribe = async () => {
    setIsLoading(true)
    try {
      await fetchApi(`/${channel.id}/subscribe`, 'POST')
      dispatchSubscriptions({
        type: SubscriptionsDispatchActionType.ADDED,
        channel: channel,
      })
      dispatchUser({
        type: UserDispatchActionType.SUBSCRIPTION_COUNT_INCREASED,
      })
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    setIsLoading(false)

    if (user?.notificationsEnabled ?? true) {
      await requestNotificationPermissions({
        registeredNotificationSubscriptions:
          user?.notificationSubscriptions ?? {},
      })
    }
  }

  const handleClickUnsubscribe = async () => {
    setIsLoading(true)
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
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    setIsLoading(false)
  }

  return (
    <div className='Channel'>
      <ChannelHeader
        channel={channel}
        isEditing={isEditing}
        isLoading={isLoading}
        title={currentTitle}
        userIsChannelOwner={userIsChannelOwner}
        onResetFormState={handleResetFormState}
        onSaveUpdates={handleSaveUpdates}
        onChangeTitle={setCurrentTitle}
        setIsEditing={setIsEditing}
      />
      {!userIsChannelOwner ? (
        <ChannelNote
          channel={channel}
          isEditing={isEditing}
          isLoading={isLoading}
          note={currentNote}
          userIsChannelOwner={userIsChannelOwner}
          onChangeNote={setCurrentNote}
        />
      ) : null}
      {userIsChannelOwner ? (
        <>
          <button
            aria-label={isOn ? 'Turn off channel' : 'Turn on channel'}
            className={`Channel-button ${isOn ? 'on' : ''}`}
            disabled={isLoading}
            onClick={
              isOn
                ? () => void handleClickCallOff()
                : () => void handleClickItsOn()
            }
          >
            <ItsOnIcon className='Channel-button-image' />
          </button>
          {isOn ? (
            <MDLinearProgress
              className='Channel-progress'
              value={onProgress}
            />
          ) : null}
          {isEditing ? (
            <MDOutlinedSelect
              className='Channel-select'
              value={`${currentDuration}`}
              onChange={event => {
                const newDuration = Number(
                  (event.target as EventTarget & HTMLSelectElement).value,
                )
                if (isNaN(newDuration)) return
                setCurrentDuration(newDuration)
              }}
            >
              {durationOptions.map(durationOption => (
                <MDSelectOption
                  disabled={isLoading}
                  key={durationOption.value}
                  selected={durationOption.value === channel.duration}
                  value={`${durationOption.value}`}
                >
                  <div slot='headline'>{durationOption.displayName}</div>
                </MDSelectOption>
              ))}
            </MDOutlinedSelect>
          ) : (
            <div className='Channel-duration-display'>
              {durationOptions.find(
                durationOption => durationOption.value === channel.duration,
              )?.displayName ?? '1 Hour'}
            </div>
          )}
          <ChannelNote
            channel={channel}
            isEditing={isEditing}
            isLoading={isLoading}
            note={currentNote}
            userIsChannelOwner={userIsChannelOwner}
            onChangeNote={setCurrentNote}
          />
          <ChannelSubscribers
            capacity={currentCapacity}
            channel={channel}
            isEditing={isEditing}
            isLoading={isLoading}
            onChangeCapacity={setCurrentCapacity}
            setIsLoading={setIsLoading}
          />
          <div className='Channel-delete-section'>
            <MDTextButton
              aria-label='Delete channel'
              className='Channel-button-delete'
              disabled={isLoading}
              hasIcon
              onClick={() => {
                handleClickDelete()
              }}
            >
              <MDIcon slot='icon'>delete</MDIcon> Delete
            </MDTextButton>
            <MDDialog open={isConfirmingDelete}>
              <div slot='headline'>Delete Channel</div>
              <div
                className='Channel-delete-confirmation-content'
                slot='content'
              >
                This channel
                {channel.title === '' || channel.title == null
                  ? ' '
                  : `, ${channel.title}, `}
                will be deleted forever. Are you sure?
              </div>
              <div slot='actions'>
                <MDTextButton
                  disabled={isLoading}
                  onClick={() => {
                    setIsConfirmingDelete(false)
                  }}
                >
                  Cancel
                </MDTextButton>
                <MDTextButton
                  className='Channel-button-delete'
                  disabled={isLoading}
                  onClick={() => void handleConfirmDelete()}
                >
                  Delete
                </MDTextButton>
              </div>
            </MDDialog>
          </div>
        </>
      ) : subscriptions.some(chan => chan.id === channel.id) ? (
        <>
          <div
            aria-label={isOn ? "It's On" : "It's Off"}
            className={`Channel-signal ${isOn ? 'on' : ''}`}
          >
            <ItsOnIcon className='Channel-button-image' />
          </div>
          {isOn ? (
            <MDLinearProgress
              className='Channel-progress'
              value={onProgress}
            />
          ) : null}
          <MDFilledTonalButton
            className='Channel-subscribe-button'
            disabled={isLoading}
            onClick={() => void handleClickUnsubscribe()}
          >
            Unsubscribe
          </MDFilledTonalButton>
        </>
      ) : (
        <>
          <MDFilledButton
            className='Channel-subscribe-button'
            disabled={isLoading || isChannelFull || userHasMaxSubscriptions}
            onClick={() => void handleClickSubscribe()}
          >
            {isChannelFull ? 'Channel Full' : 'Subscribe'}
          </MDFilledButton>
          {userHasMaxSubscriptions ? (
            <>
              <p>Subscription limit reached</p>
              <p>Unsubscribe from another channel to subscribe to a new one</p>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

export default Channel
