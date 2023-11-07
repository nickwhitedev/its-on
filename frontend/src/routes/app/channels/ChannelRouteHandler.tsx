import { useLoaderData } from 'react-router-dom'
import Channel from '../../../components/channels/channel/Channel'

const ChannelRouteHandler = () => {
  const { channelID } = useLoaderData() as { channelID: string }

  return <Channel channelID={channelID} />
}

export default ChannelRouteHandler
