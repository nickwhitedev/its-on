import './ChannelNote.css'

import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'

interface Props {
  channel: IChannel
  isEditing: boolean
  isLoading: boolean
  note: string
  userIsChannelOwner: boolean
  onChangeNote: (value: string) => void
}

const ChannelNote = ({
  channel,
  isLoading,
  isEditing,
  note,
  userIsChannelOwner,
  onChangeNote,
}: Props) => {
  return userIsChannelOwner || (channel.note?.length ?? 0) > 0 ? (
    <div className="ChannelNote">
      <div></div>
      {userIsChannelOwner && isEditing ? (
        <MDOutlinedTextField
          className={'ChannelNote-input'}
          disabled={isLoading}
          label="Channel Note"
          maxLength={200}
          placeholder="Let's meet at my place"
          rows={4}
          type="textarea"
          value={note}
          onInput={(event: { target: { value: string } }) => {
            onChangeNote(event.target.value)
          }}
        />
      ) : (
        <span className="ChannelNote-note">{channel.note}</span>
      )}
    </div>
  ) : null
}

export default ChannelNote
