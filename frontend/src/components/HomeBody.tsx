import { useChannels } from '../contexts/channels/channelsContext'
import Channel from './channels/channel/Channel'

const HomeBody = () => {
  const channels = useChannels()

  return channels.length > 0 ? <Channel channelID={channels[0].id} /> : ''
}

export default HomeBody
