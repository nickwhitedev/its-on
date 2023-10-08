import './ChannelNote.css'

import { useState } from 'react'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../utils/api'
import MDIcon from '../../material/MDIcon'
import MDOutlinedIconButton from '../../material/icon-button/MDOutlinedIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'

interface Props {
  channel: IChannel
  isLoading: boolean
  userIsChannelOwner: boolean
  setIsLoading: (newValue: boolean) => void
}

const ChannelNote = ({
  channel,
  isLoading,
  userIsChannelOwner,
  setIsLoading,
}: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const [newNote, setNewNote] = useState<string>(channel.note ?? '')

  const isUpdating = newNote !== channel.note

  const hasNote = (channel.note?.length ?? 0) > 0

  const handleSubmit = async () => {
    if (!isUpdating) return

    setIsLoading(true)

    try {
      const channelUpdates = {
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

  return (
    <div className='ChannelNote'>
      <div></div>
      {userIsChannelOwner ? (
        <MDOutlinedTextField
          className={'ChannelNote-input'}
          label='Note'
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
        <span
          className={`ChannelNote-note ${
            hasNote ? 'secondary-text' : 'instructions'
          }`}
        >
          {hasNote ? channel.note : 'Add a note for your subscribers'}
        </span>
      )}
      <div className='ChannelNote-actions'>
        {isUpdating && userIsChannelOwner ? (
          <div className='ChannelNote-actions-wrapper'>
            <MDOutlinedIconButton
              className='ChannelNote-button'
              disabled={isLoading}
              onClick={() => void handleSubmit()}
            >
              <MDIcon>done</MDIcon>
            </MDOutlinedIconButton>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ChannelNote
