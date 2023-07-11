import { fetchApi } from '../../utils/api'

const Channels = ({ channels }) => {
  const handleClickCreate = () => {
    fetchApi('/channels', 'POST', {
      defaultNote: 'default note',
      title: 'test-channel',
    })
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
