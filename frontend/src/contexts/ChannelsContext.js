import { createContext, useContext, useReducer } from 'react'

const ChannelsContext = createContext(null)

const ChannelsDispatchContext = createContext(null)

export function ChannelsProvider({ children }) {
  const [tasks, dispatch] = useReducer(tasksReducer, [])

  return (
    <ChannelsContext.Provider value={tasks}>
      <ChannelsDispatchContext.Provider value={dispatch}>
        {children}
      </ChannelsDispatchContext.Provider>
    </ChannelsContext.Provider>
  )
}

export function useTasks() {
  return useContext(ChannelsContext)
}

export function useTasksDispatch() {
  return useContext(ChannelsDispatchContext)
}

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [
        ...tasks,
        {
          id: action.id,
          text: action.text,
          done: false,
        },
      ]
    }
    case 'changed': {
      return tasks.map(t => {
        if (t.id === action.task.id) {
          return action.task
        } else {
          return t
        }
      })
    }
    case 'deleted': {
      return tasks.filter(t => t.id !== action.id)
    }
    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}
