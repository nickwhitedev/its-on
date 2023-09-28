import { MS_IN_HOUR } from '../../../utils/time'

export const isChannelOn = (channel: IChannel): boolean => {
  return (
    !channel.canceled &&
    (channel.lastOn ?? 0) + (channel.lastOnDuration ?? MS_IN_HOUR) > Date.now()
  )
}
