import Channel from './channels/channel/Channel'
import Channels from './channels/Channels'
import { useChannels } from '../contexts/channels/channelsContext'

const HomeBody = () => {
  const channels = useChannels()

  return channels.length > 0 ? (
    <Channel channelID={channels[0].id} />
  ) : (
    <Channels />
  )
}

export default HomeBody
