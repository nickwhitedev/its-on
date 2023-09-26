export const isChannelOn = (channel: IChannel): boolean => {
  return channel.lastOn + channel.duration > Date.now()
}
