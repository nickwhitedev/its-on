import './ExpiredSubscription.css'

import { useSubscriptionsDispatch } from '../../contexts/subscriptions/subscriptionsContext'
import { SubscriptionsDispatchActionType } from '../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../utils/api'

interface Props {
  channel: IChannel
}

const ExpiredSubscription = ({ channel }: Props) => {
  const dispatchSubscriptions = useSubscriptionsDispatch()

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
    <div className='ExpiredSubscription secondary-text'>
      <button
        className='ExpiredSubscription-button'
        onClick={() => void handleClickUnsubscribe()}
      >
        <span className='material-symbols-outlined red'>delete</span>
      </button>{' '}
      {channel.title} - {channel.owner} - This channel is no longer available
    </div>
  )
}

export default ExpiredSubscription
