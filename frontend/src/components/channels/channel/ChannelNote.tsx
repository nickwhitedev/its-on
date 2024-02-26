import './ChannelNote.css'

import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'

interface Props {
  channel: IChannel
  isEditing: boolean
  isLoading: boolean
  isUpdating: boolean
  currentNote: string
  userIsChannelOwner: boolean
  onChangeCurrentNote: (value: string) => void
}

const ChannelNote = ({
  channel,
  isEditing,
  isLoading,
  isUpdating,
  currentNote,
  userIsChannelOwner,
  onChangeCurrentNote,
}: Props) => {
  return userIsChannelOwner || (channel.note?.length ?? 0) > 0 ? (
    <div className='ChannelNote'>
      <div></div>
      {userIsChannelOwner && isEditing ? (
        <MDOutlinedTextField
          className={'ChannelNote-input'}
          disabled={isLoading || isUpdating}
          label='Note'
          maxLength={200}
          placeholder="Let's meet at my place"
          rows={4}
          supportingText='Leave a note or instructions for your subscribers'
          type='textarea'
          value={currentNote}
          onInput={(event: Event) => {
            onChangeCurrentNote(
              (event.target as unknown as { value: string }).value,
            )
          }}
        />
      ) : (
        <span className='ChannelNote-note'>{channel.note}</span>
      )}
    </div>
  ) : null
}

export default ChannelNote
