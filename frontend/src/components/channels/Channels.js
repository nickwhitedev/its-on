import {
  useChannels,
  useChannelsDispatch,
} from '../../contexts/ChannelsContext'
import { fetchApi } from '../../utils/api'

const Channels = () => {
  const channels = useChannels()
  const dispatch = useChannelsDispatch()

  const handleClickCreate = async () => {
    try {
      const newChannel = await fetchApi('/channels', 'POST', {
        defaultNote: 'default note',
        title: 'test-channel',
      })
      console.log('create channel response: ', newChannel)
      dispatch({ type: 'added', channel: newChannel })
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
  }

  return (
    <div>
      <h2>Channels</h2>
      <button onClick={handleClickCreate}>Create Channel</button>
      {channels.map(channel => (
        <div>
          {channel.title} - {channel.on} - {channel.note} -{' '}
          {channel.defaultNote}
        </div>
      ))}
    </div>
  )
}

export default Channels
