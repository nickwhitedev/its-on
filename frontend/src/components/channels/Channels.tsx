import CreateChannel from './CreateChannel'
import { Link } from 'react-router-dom'
import { useChannels } from '../../contexts/channels/channelsContext'

const Channels = () => {
  const channels = useChannels()

  return (
    <div>
      <h2>Channels</h2>
      <CreateChannel />
      {channels.map((channel, index) => (
        <div key={index}>
          <Link to={`/${channel.id}`}>{channel.title || 'Unnamed'}</Link> -{' '}
          {channel.on ? 'on' : 'off'}
          {channel.note.length > 0 ? ` - ${channel.note}` : ''}
        </div>
      ))}
    </div>
  )
}

export default Channels
