import { useEffect, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import Channel from '../../../components/channels/channel/Channel'
import { useChannels } from '../../../contexts/channels/channelsContext'
import { fetchApi } from '../../../utils/api'

const ChannelRouteHandler = () => {
  const { channelID } = useLoaderData() as { channelID: string }

  const navigate = useNavigate()

  const channels = useChannels()
  const [channel, setChannel] = useState<IChannel | null>(
    channels.find(chan => chan.id === channelID) ?? null,
  )

  useEffect(() => {
    channels.forEach(chan => {
      if (chan.compositeID === channelID) {
        navigate(`/${chan.id}`)
      }
    })

    void (async () => {
      setChannel(await fetchApi<IChannel>(`/${channelID}`))
    })()
  }, [channelID, channels, navigate])

  // TODO: Loading/404 states
  if (channel == null) return <h3>Loading/Not Found</h3>

  return <Channel channel={channel} />
}

export default ChannelRouteHandler
