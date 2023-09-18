import './CreateChannel.css'

import { SyntheticEvent, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { useChannelsDispatch } from '../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../contexts/channels/channelsReducer'
import { fetchApi } from '../../utils/api'

const CreateChannel = () => {
  const dispatch = useChannelsDispatch()
  const navigate = useNavigate()

  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault()

    setIsSubmitting(true)

    try {
      const newChannel: IChannel = await fetchApi('/channels', 'POST', {
        title,
      })
      dispatch({
        type: ChannelsDispatchActionType.ADDED,
        channel: newChannel,
      })
      setIsCreating(false)
      setTitle('')
      navigate(`/${newChannel.id}`)
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    setIsSubmitting(false)
  }

  return (
    <div className='CreateChannel'>
      {isCreating ? (
        <form
          className='CreateChannel-form'
          onSubmit={event => void handleSubmit(event)}
        >
          <input
            className={'CreateChannel-input'}
            autoFocus={true}
            disabled={isSubmitting}
            maxLength={40}
            value={title}
            onChange={event => {
              setTitle(event.target.value)
            }}
          />
          <button
            type='submit'
            className='CreateChannel-button'
            disabled={title === '' || isSubmitting}
          >
            <span className='material-symbols-outlined'>done</span>
          </button>
          <button
            type='reset'
            className={'CreateChannel-button'}
            disabled={isSubmitting}
            onClick={() => {
              setIsCreating(false)
              setTitle('')
            }}
          >
            <span className='material-symbols-outlined'>close</span>
          </button>
        </form>
      ) : (
        <button
          className='CreateChannel-button'
          onClick={() => {
            setIsCreating(true)
          }}
        >
          <span className='material-symbols-outlined'>add</span>
        </button>
      )}
    </div>
  )
}

export default CreateChannel
