import { useChannels } from '../contexts/ChannelsContext'
import Channel from './channels/channel/Channel.react'

const HomeBody = () => {
  const channels = useChannels()

  return channels.length > 0 ? <Channel channel={channels[0]} /> : ''
}

export default HomeBody
