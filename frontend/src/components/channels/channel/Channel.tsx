import './Channel.css'

import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import { useEffect, useState } from 'react'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'

import ChannelHeader from './ChannelHeader'
import ChannelNote from './ChannelNote'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import ItsOnIcon from '../../icons/ItsOnIcon'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../../utils/api'
import { isChannelOn } from './channelUtils'
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

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isTurningOn, setIsTurningOn] = useState<boolean>(false)

  useEffect(() => {
    document.title = channel.title
    return () => {
      document.title = "It's On"
    }
  }, [channel])

  const handleClickItsOn = async () => {
    setIsTurningOn(true)
    try {
      await fetchApi(`/${channel.id}/its-on`, 'POST')
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          lastOn: Date.now(),
        },
      })
    } catch (error) {
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }
    setIsTurningOn(false)
  }

  const handleClickDelete = async () => {
    setIsDeleting(true)
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
    setIsDeleting(false)
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
      <ChannelHeader
        channel={channel}
        userIsChannelOwner={userIsChannelOwner}
      />
      <ChannelNote
        channel={channel}
        userIsChannelOwner={userIsChannelOwner}
      />
      {userIsChannelOwner ? (
        <>
          <button
            aria-label="Turn on channel"
            className={`Channel-button ${isChannelOn(channel) ? 'on' : ''}`}
            disabled={isTurningOn}
            onClick={() => void handleClickItsOn()}
          >
            <ItsOnIcon className="Channel-button-image" />
          </button>
          <button
            aria-label="Delete channel"
            className="Channel-button Channel-button-delete red"
            disabled={isDeleting}
            onClick={() => void handleClickDelete()}
          >
            <span className="material-symbols-outlined">delete</span> Delete
          </button>
        </>
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
