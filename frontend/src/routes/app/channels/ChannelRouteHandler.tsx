import { useEffect, useState } from 'react'

import Channel from '../../../components/channels/channel/Channel'
import { fetchApi } from '../../../utils/api'
import { useChannels } from '../../../contexts/channels/channelsContext'
import { useLoaderData } from 'react-router-dom'
import { useSubscriptions } from '../../../contexts/subscriptions/subscriptionsContext'

const ChannelRouteHandler = () => {
  const { channelID } = useLoaderData() as { channelID: string }

  const channels = useChannels()
  const dispatchChannels = useChannelsDispatch()

  const subscriptions = useSubscriptions()
  const dispatchSubscriptions = useSubscriptionsDispatch()

  const [channel, setChannel] = useState<IChannel | null>(
    channels.find(chan => chan.id === channelID) ??
      subscriptions.find(chan => chan.id === channelID) ??
      null,
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
