import { createContext, useContext } from 'react'

export const ChannelsContext = createContext<IChannel[]>([])

export const ChannelsDispatchContext = createContext<
  React.Dispatch<ChannelsDispatchAction>
>(() => null)

export function useChannels() {
  return useContext(ChannelsContext)
}

export function useChannelsDispatch() {
  return useContext(ChannelsDispatchContext)
}
