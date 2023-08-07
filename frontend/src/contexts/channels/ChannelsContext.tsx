import { PropsWithChildren, createContext, useContext, useReducer } from 'react'

const ChannelsContext = createContext<IChannel[]>([])

const ChannelsDispatchContext = createContext<React.Dispatch<ChannelsDispatchAction>>(() => null)

export function ChannelsProvider({ children }: PropsWithChildren) {
  const [channels, dispatch] = useReducer(channelsReducer, [])

  return (
    <ChannelsContext.Provider value={channels}>
      <ChannelsDispatchContext.Provider value={dispatch}>
        {children}
      </ChannelsDispatchContext.Provider>
    </ChannelsContext.Provider>
  )
}

export function useChannels() {
  return useContext(ChannelsContext)
}

export function useChannelsDispatch() {
  return useContext(ChannelsDispatchContext)
}

function channelsReducer(channels: IChannel[], action: ChannelsDispatchAction): IChannel[] {
  switch (action.type) {
    case ChannelsDispatchActionType.ADDED: {
      if (action.channel == null) return channels
      return [action.channel, ...channels]
    }
    case ChannelsDispatchActionType.CHANGED: {
      return channels.map((channel: IChannel) => {
        if (channel.id === action.channel?.id) {
          return action.channel
        } else {
          return channel
        }
      })
    }
    case ChannelsDispatchActionType.DELETED: {
      return channels.filter((channel: IChannel) => channel.id !== action.id)
    }
    case ChannelsDispatchActionType.SYNCED: {
      return action.channels ?? channels
    }
  }
}
