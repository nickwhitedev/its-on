import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import Channel from '../../../components/channels/channel/Channel'
import { useChannels } from '../../../contexts/channels/channelsContext'
import { fetchApi } from '../../../utils/api'

const ChannelRouteHandler = () => {
  const { channelID } = useLoaderData() as { channelID: string }

  const channels = useChannels()
  const [channel, setChannel] = useState<IChannel | null>(
    channels.find(chan => chan.id === channelID) ?? null,
  )

  useEffect(() => {
    void (async () => {
      setChannel(await fetchApi<IChannel>(`/${channelID}`))
    })()
  }, [channelID])

  // TODO: Loading/404 states
  if (channel == null) return <h3>Loading/Not Found</h3>

  return <Channel channel={channel} />
}

export default ChannelRouteHandler
