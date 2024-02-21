import { PropsWithChildren, useReducer } from "react"
import { ChannelsContext, ChannelsDispatchContext } from "./channelsContext"
import channelsReducer from "./channelsReducer"

export default function ChannelsProvider({ children }: PropsWithChildren) {
  const [channels, dispatch] = useReducer(channelsReducer, [])

  return (
    <ChannelsContext.Provider value={channels}>
      <ChannelsDispatchContext.Provider value={dispatch}>
        {children}
      </ChannelsDispatchContext.Provider>
    </ChannelsContext.Provider>
  )
}
