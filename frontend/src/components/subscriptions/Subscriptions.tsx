import ExpiredSubscription from './ExpiredSubscription'
import { Link } from 'react-router-dom'
import { isChannelOn } from '../channels/channel/channelUtils'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'

const Subscriptions = () => {
  const subscriptions = useSubscriptions()

  return (
    <div>
      <h2>Subscriptions</h2>
      {subscriptions.map((channel, index) => (
        <div key={index}>
          {channel.deleted ? (
            <ExpiredSubscription channel={channel} />
          ) : (
            <div>
              <Link to={`/${channel.id}`}>{channel.title}</Link> -{' '}
              {channel.owner} - {isChannelOn(channel) ? 'on' : 'off'}
              {channel.note.length > 0 ? ` - ${channel.note}` : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Subscriptions
