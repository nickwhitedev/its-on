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
