import './Channel.css'

import React, { useEffect, useState } from 'react'
import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'
import { channelOnProgress, durationOptions, isChannelOn } from './channelUtils'

import { useNavigate } from 'react-router-dom'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { useUser, useUserDispatch } from '../../../contexts/user/userContext'
import { UserDispatchActionType } from '../../../contexts/user/userReducer'
import { fetchApi } from '../../../utils/api'
import { MS_IN_HOUR } from '../../../utils/time'
import ItsOnIcon from '../../icons/ItsOnIcon'
import MDDivider from '../../material/MDDivider'
import MDIcon from '../../material/MDIcon'
import MDFilledButton from '../../material/button/MDFilledButton'
import MDFilledTonalButton from '../../material/button/MDFilledTonalButton'
import MDTextButton from '../../material/button/MDTextButton'
import MDList from '../../material/list/MDList'
import MDListItem from '../../material/list/MDListItem'
import MDLinearProgress from '../../material/progress/MDLinearProgress'
import MDOutlinedSelect from '../../material/select/MDOutlinedSelect'
import MDSelectOption from '../../material/select/MDSelectOption'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'
import ChannelHeader from './ChannelHeader'
import ChannelNote from './ChannelNote'

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
  const [newCapacity, setNewCapacity] = useState<string>(
    `${channel.capacity ?? 5}`,
  )

  const isOn = isChannelOn(channel)
  const onProgress = channelOnProgress(channel)

  const subscriberCount = channel.subscriberCount ?? 0
  const isChannelFull = subscriberCount >= (channel.capacity ?? 5)

  const userTier = user?.tier ?? 5
  const userHasMaxSubscriptions = (user?.subscriptionCount ?? 0) >= userTier

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

  const handleChangeDuration = async (event: Event) => {
    const newDuration = Number(
      (event.target as EventTarget & HTMLSelectElement).value,
    )
    if (isNaN(newDuration)) return
    setIsLoading(true)

    try {
      const channelUpdates = {
        capacity: channel.capacity,
        duration: newDuration,
        note: channel.note,
        title: channel.title,
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
  }

  const handleChangeCapacity = async () => {
    const targetCapacity = Number(newCapacity)

    if (
      isNaN(targetCapacity) ||
      targetCapacity > userTier ||
      targetCapacity === channel.capacity
    )
      return
    setIsLoading(true)

    try {
      const channelUpdates = {
        capacity: targetCapacity,
        duration: channel.duration,
        note: channel.note,
        title: channel.title,
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

  const handleClickDelete = async () => {
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
        userIsChannelOwner={userIsChannelOwner}
        setIsEditing={setIsEditing}
        setIsLoading={setIsLoading}
      />
      {!userIsChannelOwner ? (
        <ChannelNote
          channel={channel}
          isEditing={isEditing}
          isLoading={isLoading}
          userIsChannelOwner={userIsChannelOwner}
          setIsLoading={setIsLoading}
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
              value={`${channel.duration ?? MS_IN_HOUR}`}
              onChange={event => void handleChangeDuration(event)}
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
            userIsChannelOwner={userIsChannelOwner}
            setIsLoading={setIsLoading}
          />
          <div className='Channel-subscribers'>
            <MDList className='Channel-subscribers-list'>
              <MDListItem>
                <div slot='headline'>Subscribers</div>
                <div slot='trailing-supporting-text'>
                  {subscriberCount}
                  {channel.capacity == null ? null : (
                    <>
                      {' '}
                      /{' '}
                      {isEditing ? (
                        <MDOutlinedTextField
                          className={'Channel-subscribers-capacity-input'}
                          error={Number(newCapacity) > 5}
                          max={`${userTier}`}
                          min={`${subscriberCount}`}
                          step='1'
                          type='number'
                          value={newCapacity}
                          onInput={event => {
                            setNewCapacity(
                              `${Math.floor(
                                Number(
                                  (
                                    event.target as EventTarget &
                                      HTMLSelectElement
                                  ).value,
                                ),
                              )}`,
                            )
                          }}
                          onChange={() => void handleChangeCapacity()}
                        />
                      ) : (
                        channel.capacity
                      )}
                    </>
                  )}
                </div>
              </MDListItem>
              {channel.subscribers?.map(subscriber => (
                <React.Fragment key={subscriber.id}>
                  <MDDivider inset />
                  <MDListItem>
                    <div slot='supporting-text'>{subscriber.username}</div>
                  </MDListItem>
                </React.Fragment>
              )) ?? (
                <>
                  <MDDivider inset />
                  <MDListItem>
                    Share your channel to let people know it&apos;s on!
                  </MDListItem>
                </>
              )}
            </MDList>
          </div>
          <MDTextButton
            aria-label='Delete channel'
            className='Channel-button-delete'
            disabled={isLoading}
            hasIcon
            onClick={() => void handleClickDelete()}
          >
            <MDIcon slot='icon'>delete</MDIcon> Delete
          </MDTextButton>
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
              <p>Subscription limit reached.</p>
              <p>Unsubscribe from another channel to subscribe to a new one.</p>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

export default Channel
