import './ChannelHeader.css'

import ItsOnIcon from '../../icons/ItsOnIcon'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'
import { baseUrl } from '../../../utils/urls'
import { useState } from 'react'

interface Props {
  channel: IChannel
  isEditing: boolean
  isLoading: boolean
  isOn: boolean
  title: string
  userIsChannelOwner: boolean
  onChangeTitle: (value: string) => void
  onResetFormState: () => void
  onSaveUpdates: () => Promise<void>
  setIsEditing: (newValue: boolean) => void
}

const ChannelHeader = ({
  channel,
  isEditing,
  isLoading,
  isOn,
  title,
  userIsChannelOwner,
  onChangeTitle,
  onSaveUpdates,
  onResetFormState,
  setIsEditing,
}: Props) => {
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const channelDisplayTitle = title === '' ? 'Untitled' : channel.title

  const handleClickShareChannel = async () => {
    const channelURL = `${baseUrl}/${channel.id}`
    try {
      await navigator.share({
        title: `It's On - ${channelDisplayTitle}`,
        text: `Check out the channel, ${channelDisplayTitle}, by ${channel.owner}`,
        url: channelURL,
      })
    } catch (error) {
      await navigator.clipboard.writeText(channelURL)
      setChannelCopied(true)
    }
  }

  return (
    <div className={`ChannelHeader ${userIsChannelOwner ? 'editable' : ''}`}>
      <div className="ChannelHeader-edit">
        {userIsChannelOwner ? (
          <div className="ChannelHeader-save-wrapper">
            {isEditing ? (
              <MDIconButton
                className="ChannelHeader-button"
                disabled={!channel.title || isLoading}
                onClick={() => {
                  setIsEditing(false)
                  onResetFormState()
                }}
              >
                <MDIcon>close</MDIcon>
              </MDIconButton>
            ) : (
              <MDIconButton
                className="ChannelHeader-button"
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
            slot="start"
          >
            <ItsOnIcon />
          </MDIcon>
        )}
      </div>
      {isEditing ? (
        <MDOutlinedTextField
          // TODO: Implement autoFocus with ref
          className={'ChannelHeader-input'}
          disabled={isLoading}
          label="Channel Title"
          maxLength={40}
          rows={1}
          type="textarea"
          value={title}
          onInput={event => {
            onChangeTitle((event.target as unknown as { value: string }).value)
          }}
        />
      ) : (
        <div className="ChannelHeader-title">
          <h2 className="ChannelHeader-title">{channelDisplayTitle}</h2>
          {userIsChannelOwner ? null : (
            <span className="secondary-text">by {channel.owner}</span>
          )}
        </div>
      )}
      <div className="ChannelHeader-share">
        {userIsChannelOwner && isEditing ? (
          <div className="ChannelHeader-save-wrapper">
            <MDIconButton
              className="ChannelHeader-button"
              disabled={title === '' || isLoading}
              onClick={() => void onSaveUpdates()}
            >
              <MDIcon>done</MDIcon>
            </MDIconButton>
          </div>
        ) : (
          <div className="ChannelHeader-share-wrapper">
            <MDIconButton
              aria-label="Share"
              disabled={isLoading}
              onClick={() => void handleClickShareChannel()}
              onBlur={() => {
                setChannelCopied(false)
              }}
            >
              <MDIcon>share</MDIcon>
            </MDIconButton>
            <span
              className={`ChannelHeader-copied secondary-text ${
                channelCopied ? '' : 'hidden'
              }`}
            >
              Copied!
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChannelHeader
