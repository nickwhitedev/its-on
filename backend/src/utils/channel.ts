export const isChannelOn = (
  lastOn: number,
  duration: number,
  requestTime: number,
): boolean => {
  return lastOn + duration > requestTime
}
