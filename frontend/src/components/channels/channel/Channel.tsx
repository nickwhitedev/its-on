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
import { durationOptions, isChannelOn } from './channelUtils'

import { useNavigate } from 'react-router-dom'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../../utils/api'
import { MS_IN_HOUR } from '../../../utils/time'
import ItsOnIcon from '../../icons/ItsOnIcon'
import MDDivider from '../../material/MDDivider'
import MDOutlinedSelect from '../../material/MDOutlinedSelect'
import MDSelectOption from '../../material/MDSelectOption'
import MDList from '../../material/list/MDList'
import MDListItem from '../../material/list/MDListItem'
import ChannelHeader from './ChannelHeader'
import ChannelNote from './ChannelNote'

interface Props {
  channel: IChannel
}

const Channel = ({ channel }: Props) => {
  const channels = useChannels()
  const userIsChannelOwner = channels.some(ch => ch.id === channel.id)

  const subscriptions = useSubscriptions()
  const navigate = useNavigate()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const isOn = isChannelOn(channel)

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
        isLoading={isLoading}
        userIsChannelOwner={userIsChannelOwner}
        setIsLoading={setIsLoading}
      />
      <ChannelNote
        channel={channel}
        isLoading={isLoading}
        userIsChannelOwner={userIsChannelOwner}
        setIsLoading={setIsLoading}
      />
      {userIsChannelOwner ? (
        <>
          <MDOutlinedSelect
            className='Channel-select'
            disabled={isLoading}
            value={`${channel.duration ?? MS_IN_HOUR}`}
            onChange={event => void handleChangeDuration(event)}
          >
            {durationOptions.map(durationOption => (
              <MDSelectOption
                key={durationOption.value}
                selected={durationOption.value === channel.duration}
                value={`${durationOption.value}`}
              >
                <div slot='headline'>{durationOption.displayName}</div>
              </MDSelectOption>
            ))}
          </MDOutlinedSelect>
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
          <div className='Channel-subscribers'>
            <MDList className='Channel-subscribers-list'>
              <MDListItem>
                <div slot='headline'>Subscribers</div>
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
                  <MDListItem>Share your channel to get subscribers</MDListItem>
                </>
              )}
            </MDList>
          </div>
          <button
            aria-label='Delete channel'
            className='Channel-button Channel-button-delete red'
            disabled={isLoading}
            onClick={() => void handleClickDelete()}
          >
            <span className='material-symbols-outlined'>delete</span> Delete
          </button>
        </>
      ) : subscriptions.some(chan => chan.id === channel.id) ? (
        <button
          disabled={isLoading}
          onClick={() => void handleClickUnsubscribe()}
        >
          Unsubscribe
        </button>
      ) : (
        <button
          disabled={isLoading}
          onClick={() => void handleClickSubscribe()}
        >
          Subscribe
        </button>
      )}
    </div>
  )
}

export default Channel
