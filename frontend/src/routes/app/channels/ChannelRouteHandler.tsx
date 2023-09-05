import {
  useChannels,
  useChannelsDispatch,
} from '../../../contexts/channels/channelsContext'
import { useEffect, useState } from 'react'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../../contexts/subscriptions/subscriptionsContext'

import Channel from '../../../components/channels/channel/Channel'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { SubscriptionsDispatchActionType } from '../../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../../utils/api'
import { useLoaderData } from 'react-router-dom'

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
      const fetchedChannel = await fetchApi<IChannel>(`/${channelID}`)
      if (channelID in channels) {
        dispatchChannels({
          type: ChannelsDispatchActionType.CHANGED,
          channel: fetchedChannel,
        })
      } else if (channelID in subscriptions) {
        dispatchSubscriptions({
          type: SubscriptionsDispatchActionType.CHANGED,
          channel: fetchedChannel,
        })
      } else {
        setChannel(fetchedChannel)
      }
    })()
  }, [
    channelID,
    channels,
    dispatchChannels,
    dispatchSubscriptions,
    subscriptions,
  ])

  // TODO: Loading/404 states
  if (channel == null) return <h3>Loading/Not Found</h3>

  return <Channel channel={channel} />
}

export default ChannelRouteHandler
