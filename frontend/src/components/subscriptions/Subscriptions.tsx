import { Link } from 'react-router-dom'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'

const Subscriptions = () => {
  const subscriptions = useSubscriptions()

  return (
    <div>
      <h2>Subscriptions</h2>
      {subscriptions.map((channel, index) => (
        <div key={index}>
          <Link to={`/${channel.id}`}>{channel.title}</Link> - {channel.owner} -{' '}
          {channel.on ? 'on' : 'off'} - {channel.note || channel.defaultNote}
        </div>
      ))}
    </div>
  )
}

export default Subscriptions
