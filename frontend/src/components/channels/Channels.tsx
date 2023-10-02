import { Link } from 'react-router-dom'
import { useChannels } from '../../contexts/channels/channelsContext'
import CreateChannel from './CreateChannel'
import { isChannelOn } from './channel/channelUtils'

const Channels = () => {
  const channels = useChannels()

  return (
    <div>
      <h2>Channels</h2>
      <CreateChannel />
      {channels.map((channel, index) => (
        <div key={index}>
          <Link to={`/${channel.id}`}>
            {(channel.title?.length ?? 0) > 0 ? channel.title : 'Untitled'}
          </Link>{' '}
          - {isChannelOn(channel) ? 'on' : 'off'}
          {(channel.note?.length ?? 0) > 0 ? ` - ${channel.note}` : ''}
        </div>
      ))}
    </div>
  )
}

export default Channels
