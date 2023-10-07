import { MS_IN_HOUR, MS_IN_MINUTE } from '../../../utils/time'

export const durationOptions: IDurationOptions[] = [
  { displayName: '30 Minutes', value: MS_IN_MINUTE * 30 },
  { displayName: '1 Hour', value: MS_IN_HOUR },
  { displayName: '1.5 Hours', value: MS_IN_MINUTE * 90 },
  { displayName: '2 Hours', value: MS_IN_HOUR * 2 },
  { displayName: '3 Hours', value: MS_IN_HOUR * 3 },
  { displayName: '6 Hours', value: MS_IN_HOUR * 6 },
  { displayName: '12 Hours', value: MS_IN_HOUR * 12 },
]

export const isChannelOn = (channel: IChannel): boolean => {
  return (
    !channel.canceled &&
    (channel.lastOn ?? 0) + (channel.lastOnDuration ?? MS_IN_HOUR) > Date.now()
  )
}

export const channelsSorter = (
  channelA: IChannel,
  channelB: IChannel,
): number => {
  const isChannelAOn = isChannelOn(channelA)
  const isChannelBOn = isChannelOn(channelB)
  if (isChannelAOn !== isChannelBOn) {
    return isChannelAOn ? -1 : 1
  }
  return (channelB.lastUpdated ?? 0) - (channelA.lastUpdated ?? 0)
}
