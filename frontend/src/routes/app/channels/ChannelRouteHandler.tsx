import { useLoaderData } from 'react-router-dom'
import Channel from '../../../components/channels/channel/Channel'
import { fetchApi } from '../../../utils/api'

// TODO: Get channel data from api
export const loader = async ({ params }) => {
  const channel = await fetchApi(`/${params.channelID}`)
  return { channel }
}

const ChannelRouteHandler = () => {
  const { channel } = useLoaderData()
  return <Channel channel={channel} />
}

export default ChannelRouteHandler
