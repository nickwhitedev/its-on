import './Channel.css'

import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'

import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import ItsOnIcon from '../../icons/ItsOnIcon'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { baseUrl } from '../../../utils/urls'
import { fetchApi } from '../../../utils/api'
import { useEffect } from 'react'

interface Props {
  channel: IChannel
}

const Channel = ({ channel }: Props) => {
  const channels = useChannels()
  const userIsChannelOwner = channels.some(ch => ch.id === channel.id)

  const subscriptions = useSubscriptions()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()

  const hasNote = channel.note.length > 0

  useEffect(() => {
    document.title = channel.title
    return () => {
      document.title = "It's On"
    }
  }, [channel])

  const handleClickItsOn = async () => {
    try {
      const channelUpdates = {
        id: channel.id,
        note: channel.note,
        on: !channel.on,
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
  }

  const handleClickSubscribe = async () => {
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
  }

  const handleClickShareChannel = async () => {
    const channelURL = `${baseUrl}/${channel.id}`
    try {
      await navigator.share({
        title: `It's On - ${channel.title}`,
        text: `Check out the channel, ${channel.title} by ${channel.owner}`,
        url: channelURL,
      })
    } catch (error) {
      await navigator.clipboard.writeText(channelURL)
    }
  }

  const handleClickUnsubscribe = async () => {
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
  }

  return (
    <div className="Channel">
      <div className="Channel-header">
        <h2 className="Channel-title">{channel.title}</h2>
        <div className="Channel-share">
          <button
            onClick={() => void handleClickShareChannel()}
            aria-label="Share"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>
      <span
        className={`Channel-note ${
          hasNote ? 'secondary-text' : 'instructions'
        }`}
      >
        {hasNote ? channel.note : 'Extra details'}
      </span>
      {userIsChannelOwner ? (
        <button
          onClick={() => void handleClickItsOn()}
          className={`Channel-button ${channel.on ? 'on' : ''}`}
          aria-label="Turn on channel"
        >
          <ItsOnIcon className="Channel-button-image" />
        </button>
      ) : subscriptions.some(chan => chan.id === channel.id) ? (
        <button onClick={() => void handleClickUnsubscribe()}>
          Unsubscribe
        </button>
      ) : (
        <button onClick={() => void handleClickSubscribe()}>Subscribe</button>
      )}
    </div>
  )
}

export default Channel
