interface isChannelOnParams {
  canceled: boolean
  duration: number
  lastOn: number
  requestTime: number
}

export const isChannelOn = ({
  canceled,
  duration,
  lastOn,
  requestTime,
}: isChannelOnParams): boolean => {
  return !canceled && lastOn + duration > requestTime
}
