import { createContext, useContext, useReducer } from 'react'

const ChannelsContext = createContext(null)

const ChannelsDispatchContext = createContext(null)

export function ChannelsProvider({ children }) {
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

function channelsReducer(channels, action) {
  switch (action.type) {
    case 'added': {
      return [action.channel, ...channels]
    }
    case 'changed': {
      return channels.map(t => {
        if (t.id === action.channel.id) {
          return action.channel
        } else {
          return t
        }
      })
    }
    case 'deleted': {
      return channels.filter(t => t.id !== action.id)
    }
    case 'synced': {
      return action.channels
    }
    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}
