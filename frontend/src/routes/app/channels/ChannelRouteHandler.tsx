import { useLoaderData } from 'react-router-dom'
import Channel from '../../../components/channels/channel/Channel'

const ChannelRouteHandler = () => {
  const { channel } = useLoaderData() as { channel: IChannel }
  return <Channel channel={channel} />
}

export default ChannelRouteHandler
