import './Channel.css'

import React, { useEffect, useState } from 'react'
import { durationOptions, isChannelOn } from './channelUtils'
import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'

import ChannelHeader from './ChannelHeader'
import ChannelNote from './ChannelNote'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import ItsOnIcon from '../../icons/ItsOnIcon'
import MDDivider from '../../material/MDDivider'
import MDFilledButton from '../../material/button/MDFilledButton'
import MDFilledTonalButton from '../../material/button/MDFilledTonalButton'
import MDIcon from '../../material/MDIcon'
import MDList from '../../material/list/MDList'
import MDListItem from '../../material/list/MDListItem'
import MDOutlinedSelect from '../../material/select/MDOutlinedSelect'
import MDSelectOption from '../../material/select/MDSelectOption'
import MDTextButton from '../../material/button/MDTextButton'
import { MS_IN_HOUR } from '../../../utils/time'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../../utils/api'
import { useNavigate } from 'react-router-dom'

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
    <div className="Channel">
      <ChannelHeader
        channel={channel}
        isLoading={isLoading}
        userIsChannelOwner={userIsChannelOwner}
        setIsLoading={setIsLoading}
      />
      {!userIsChannelOwner ? (
        <ChannelNote
          channel={channel}
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
            <ItsOnIcon className="Channel-button-image" />
          </button>
          <MDOutlinedSelect
            className="Channel-select"
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
                <div slot="headline">{durationOption.displayName}</div>
              </MDSelectOption>
            ))}
          </MDOutlinedSelect>
          <ChannelNote
            channel={channel}
            isLoading={isLoading}
            userIsChannelOwner={userIsChannelOwner}
            setIsLoading={setIsLoading}
          />
          <div className="Channel-subscribers">
            <MDList className="Channel-subscribers-list">
              <MDListItem>
                <div slot="headline">Subscribers</div>
                <div slot="trailing-supporting-text">
                  {channel.subscribers?.length}
                  {/* TODO: Add denominator when limit is added */}
                </div>
              </MDListItem>
              {channel.subscribers?.map(subscriber => (
                <React.Fragment key={subscriber.id}>
                  <MDDivider inset />
                  <MDListItem>
                    <div slot="supporting-text">{subscriber.username}</div>
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
            aria-label="Delete channel"
            className="Channel-button-delete"
            disabled={isLoading}
            hasIcon
            onClick={() => void handleClickDelete()}
          >
            <MDIcon slot="icon">delete</MDIcon> Delete
          </MDTextButton>
        </>
      ) : subscriptions.some(chan => chan.id === channel.id) ? (
        <>
          <div
            aria-label={isOn ? "It's On" : "It's Off"}
            className={`Channel-signal ${isOn ? 'on' : ''}`}
          >
            <ItsOnIcon className="Channel-button-image" />
          </div>
          <MDFilledTonalButton
            className="Channel-subscribe-button"
            disabled={isLoading}
            onClick={() => void handleClickUnsubscribe()}
          >
            Unsubscribe
          </MDFilledTonalButton>
        </>
      ) : (
        <MDFilledButton
          className="Channel-subscribe-button"
          disabled={isLoading}
          onClick={() => void handleClickSubscribe()}
        >
          Subscribe
        </MDFilledButton>
      )}
    </div>
  )
}

export default Channel
