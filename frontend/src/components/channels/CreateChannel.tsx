import './CreateChannel.css'

import { SyntheticEvent, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { useChannelsDispatch } from '../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../contexts/channels/channelsReducer'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import { useFetchApi } from '../../utils/api'
import { useSendLog } from '../../utils/logging'

const CreateChannel = () => {
  const dispatchChannels = useChannelsDispatch()
  const dispatchError = useErrorDispatch()

  const navigate = useNavigate()
  const fetchApi = useFetchApi()
  const sendLog = useSendLog()

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
      dispatchChannels({
        type: ChannelsDispatchActionType.ADDED,
        channel: newChannel,
      })
      setIsCreating(false)
      setTitle('')
      navigate(`/${newChannel.id}`)
    } catch (error) {
      await sendLog('CreateChannel create channel error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
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
