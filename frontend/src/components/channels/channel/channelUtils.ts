import { MS_IN_HOUR } from '../../../utils/time'

export const isChannelOn = (channel: IChannel): boolean => {
  return (channel.lastOn ?? 0) + (channel.duration ?? MS_IN_HOUR) > Date.now()
}
