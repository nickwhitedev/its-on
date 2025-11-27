import { MS_IN_HOUR, MS_IN_MINUTE } from './time.js'

interface isChannelOnParams {
  canceled: boolean
  lastOn: number
  lastOnDuration: number
  requestTime: number
}

export const isChannelOn = ({
  canceled,
  lastOn,
  lastOnDuration,
  requestTime,
}: isChannelOnParams): boolean => {
  return !canceled && lastOn + lastOnDuration > requestTime
}

export const getNewSubscriberNotificationCooldown = (
  subscriberCount: number,
): number => {
  if (subscriberCount < 10) {
    return MS_IN_MINUTE * 15
  }
  return MS_IN_HOUR * 24
}
