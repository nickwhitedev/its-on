import './ChannelNote.css'

import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../utils/api'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { useState } from 'react'

interface Props {
  channel: IChannel
}

const ChannelNote = ({ channel }: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [newNote, setNewNote] = useState<string>(channel.note)

  const hasNote = channel.note.length > 0

  const handleSubmit = async () => {
    if (newNote === channel.note) {
      setIsUpdating(false)
      return
    }

    setIsSubmitting(true)

    try {
      const channelUpdates = {
        note: newNote,
        on: channel.on,
        title: channel.title,
      }
      await fetchApi(`/${channel.id}`, 'PUT', channelUpdates)
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          ...channelUpdates,
        },
      })
      setIsUpdating(false)
    } catch (error) {
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }

    setIsSubmitting(false)
  }

  return (
    <div className="ChannelNote">
      <div className="ChannelNote-edit">
        {isUpdating ? null : (
          <button
            className={'ChannelNote-edit-button'}
            onClick={() => {
              setIsUpdating(true)
            }}
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
        )}
      </div>
      {isUpdating ? (
        <textarea
          className={'ChannelNote-input'}
          autoFocus={true}
          disabled={isSubmitting}
          maxLength={200}
          value={newNote}
          onChange={event => {
            setNewNote(event.target.value)
          }}
        />
      ) : (
        <span
          className={`ChannelNote-note ${
            hasNote ? 'secondary-text' : 'instructions'
          }`}
        >
          {hasNote ? channel.note : 'Add a note for your subscribers'}
        </span>
      )}
      {isUpdating ? (
        <div className="ChannelNote-form-buttons">
          <button
            className="ChannelNote-button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            <span className="material-symbols-outlined">done</span>
          </button>
          <button
            className={'ChannelNote-button'}
            disabled={isSubmitting}
            onClick={() => {
              setIsUpdating(false)
              setNewNote(channel.note)
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default ChannelNote
