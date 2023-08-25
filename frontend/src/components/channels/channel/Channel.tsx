import { version as uuidVersion } from 'uuid'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../../utils/api'
import { baseUrl } from '../../../utils/urls'

interface Props {
  channel: IChannel
}

const Channel = ({ channel }: Props) => {
  const userIsChannelOwner = uuidVersion(channel.id) === 1

  const subscriptions = useSubscriptions()

  const dispatchChannels = useChannelsDispatch()
  const dispatchSubscriptions = useSubscriptionsDispatch()

  const handleClickItsOn = async () => {
    try {
      const newChannel: IChannel = await fetchApi(`/${channel.id}`, 'PUT', {
        compositeID: channel.compositeID,
        defaultNote: channel.defaultNote,
        id: channel.id,
        note: channel.note,
        on: !channel.on,
        title: channel.title,
      })
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: newChannel,
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
    <div>
      {userIsChannelOwner ? (
        <button onClick={() => void handleClickItsOn()}>
          Activate/Deactivate
        </button>
      ) : subscriptions.some(chan => chan.id === channel.id) ? (
        <button onClick={() => void handleClickUnsubscribe()}>
          Unsubscribe
        </button>
      ) : (
        <button onClick={() => void handleClickSubscribe()}>Subscribe</button>
      )}
      <h2>{channel.title}</h2>
      {channel.on ? <p>It&apos;s On!</p> : null}
      <p>{channel.note || channel.defaultNote}</p>
      {userIsChannelOwner ? <p>{`${baseUrl}/${channel.compositeID}`}</p> : ''}
    </div>
  )
}

export default Channel
