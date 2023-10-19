import './ChannelNote.css'

import { useState } from 'react'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../utils/api'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'

interface Props {
  channel: IChannel
  isEditing: boolean
  isLoading: boolean
  userIsChannelOwner: boolean
  setIsLoading: (newValue: boolean) => void
}

const ChannelNote = ({
  channel,
  isLoading,
  isEditing,
  userIsChannelOwner,
  setIsLoading,
}: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const [newNote, setNewNote] = useState<string>(channel.note ?? '')

  const isUpdating = newNote !== channel.note

  const handleSubmit = async () => {
    if (!isUpdating) return

    setIsLoading(true)

    try {
      const channelUpdates = {
        capacity: channel.capacity,
        duration: channel.duration,
        note: newNote,
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
    } catch (error) {
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }

    setIsLoading(false)
  }

  return userIsChannelOwner || (channel.note?.length ?? 0) > 0 ? (
    <div className='ChannelNote'>
      <div></div>
      {userIsChannelOwner && isEditing ? (
        <MDOutlinedTextField
          className={'ChannelNote-input'}
          label='Channel Note'
          maxLength={200}
          placeholder="Let's meet at my place"
          rows={4}
          type='textarea'
          value={newNote}
          onInput={event => {
            setNewNote((event.target as unknown as { value: string }).value)
          }}
        />
      ) : (
        <span className='ChannelNote-note'>{channel.note}</span>
      )}
      <div className='ChannelNote-actions'>
        {isUpdating && userIsChannelOwner ? (
          <div className='ChannelNote-actions-wrapper'>
            <MDIconButton
              className='ChannelNote-button'
              disabled={isLoading}
              onClick={() => void handleSubmit()}
            >
              <MDIcon>done</MDIcon>
            </MDIconButton>
          </div>
        ) : null}
      </div>
    </div>
  ) : null
}

export default ChannelNote
