import { Link } from 'react-router-dom'
import {
  useChannels,
  useChannelsDispatch,
} from '../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../contexts/channels/channelsReducer'
import { fetchApi } from '../../utils/api'

const Channels = () => {
  const channels = useChannels()
  const dispatch = useChannelsDispatch()

  const handleClickCreate = async () => {
    try {
      const newChannel: IChannel = await fetchApi('/channels', 'POST', {
        defaultNote: 'default note',
        title: 'test-channel',
      })
      dispatch({
        type: ChannelsDispatchActionType.ADDED,
        channel: newChannel,
      })
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
  }

  return (
    <div>
      <h2>Channels</h2>
      <button onClick={() => void handleClickCreate()}>Create Channel</button>
      {channels.map((channel, index) => (
        <div key={index}>
          <Link to={`/channels/${channel.id}`}>{channel.title}</Link> -{' '}
          {channel.on ? 'on' : 'off'} - {channel.note || channel.defaultNote}
        </div>
      ))}
    </div>
  )
}

export default Channels
