import './ChannelHeader.css'

import ItsOnIcon from '../../icons/ItsOnIcon'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'
import ShareChannelButton from './ShareChannelButton'
import { channelDisplayTitle } from './channelUtils'

interface Props {
  channel: IChannel
  isEditing: boolean
  isUpdating: boolean
  isOn: boolean
  currentTitle: string
  userIsChannelOwner: boolean
  onChangeCurrentTitle: (value: string) => void
  onResetFormState: () => void
  onSaveUpdates: () => Promise<void>
  setIsEditing: (newValue: boolean) => void
}

const ChannelHeader = ({
  channel,
  isEditing,
  isUpdating,
  isOn,
  currentTitle,
  userIsChannelOwner,
  onChangeCurrentTitle,
  onSaveUpdates,
  onResetFormState,
  setIsEditing,
}: Props) => {
  return (
    <div className={`ChannelHeader ${userIsChannelOwner ? 'editable' : ''}`}>
      <div className='ChannelHeader-edit'>
        {userIsChannelOwner ? (
          <div className='ChannelHeader-save-wrapper'>
            {isEditing ? (
              <MDIconButton
                className='ChannelHeader-button'
                disabled={!channel.title || isUpdating}
                onClick={() => {
                  setIsEditing(false)
                  onResetFormState()
                }}
              >
                <MDIcon>close</MDIcon>
              </MDIconButton>
            ) : (
              <MDIconButton
                className='ChannelHeader-button'
                disabled={false}
                onClick={() => {
                  setIsEditing(true)
                }}
              >
                <MDIcon>edit</MDIcon>
              </MDIconButton>
            )}
          </div>
        ) : (
          <MDIcon
            className={
              isOn ? 'ChannelHeader-icon-on' : 'ChannelHeader-icon-off'
            }
            slot='start'
          >
            <ItsOnIcon />
          </MDIcon>
        )}
      </div>
      {isEditing ? (
        <MDOutlinedTextField
          className={'ChannelHeader-input'}
          disabled={isUpdating}
          label='Title'
          maxLength={40}
          rows={1}
          type='textarea'
          value={currentTitle}
          onInput={(event: Event) => {
            onChangeCurrentTitle(
              (event.target as unknown as { value: string }).value,
            )
          }}
        />
      ) : (
        <div className='ChannelHeader-title'>
          <h2 className='ChannelHeader-title'>
            {channelDisplayTitle(channel)}
          </h2>
          {userIsChannelOwner ? null : (
            <span className='secondary-text'>by {channel.owner}</span>
          )}
        </div>
      )}
      <div className='ChannelHeader-share'>
        {userIsChannelOwner && isEditing ? (
          <div className='ChannelHeader-save-wrapper'>
            <MDIconButton
              className='ChannelHeader-button'
              disabled={currentTitle === '' || isUpdating}
              onClick={() => void onSaveUpdates()}
            >
              <MDIcon>done</MDIcon>
            </MDIconButton>
          </div>
        ) : (
          <ShareChannelButton
            channel={channel}
            isUpdating={isUpdating}
            size='small'
          />
        )}
      </div>
    </div>
  )
}

export default ChannelHeader
