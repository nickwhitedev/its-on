import './ChannelHeader.css'

import { useState } from 'react'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../utils/api'
import { baseUrl } from '../../../utils/urls'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'

interface Props {
  channel: IChannel
  isEditing: boolean
  isLoading: boolean
  userIsChannelOwner: boolean
  setIsEditing: (newValue: boolean) => void
  setIsLoading: (newValue: boolean) => void
}

const ChannelHeader = ({
  channel,
  isEditing,
  isLoading,
  userIsChannelOwner,
  setIsEditing,
  setIsLoading,
}: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const [newTitle, setNewTitle] = useState<string>(channel.title ?? '')
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const isUpdating = newTitle !== channel.title

  const channelDisplayTitle =
    channel.title === '' || channel.title == null ? 'Untitled' : channel.title

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const channelUpdates = {
        capacity: channel.capacity,
        duration: channel.duration,
        note: channel.note,
        title: newTitle,
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

  const handleClickShareChannel = async () => {
    const channelURL = `${baseUrl}/${channel.id}`
    try {
      await navigator.share({
        title: `It's On - ${channelDisplayTitle}`,
        text: `Check out the channel, ${channelDisplayTitle} by ${channel.owner}`,
        url: channelURL,
      })
    } catch (error) {
      await navigator.clipboard.writeText(channelURL)
      setChannelCopied(true)
    }
  }

  return (
    <div className={`ChannelHeader ${userIsChannelOwner ? 'editable' : ''}`}>
      <div className='ChannelHeader-edit'>
        {userIsChannelOwner ? (
          <div className='ChannelHeader-save-wrapper'>
            {isEditing ? (
              <MDIconButton
                className='ChannelHeader-button'
                disabled={!channel.title || isLoading}
                onClick={() => {
                  setIsEditing(false)
                  setNewTitle(channel.title ?? '')
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
        ) : null}
      </div>
      {isEditing ? (
        <MDOutlinedTextField
          // TODO: Implement autoFocus with ref
          className={'ChannelHeader-input'}
          label='Channel Title'
          maxLength={40}
          rows={1}
          type='textarea'
          value={newTitle}
          onInput={event => {
            setNewTitle((event.target as unknown as { value: string }).value)
          }}
        />
      ) : (
        <div className='ChannelHeader-title'>
          <h2 className='ChannelHeader-title'>{channelDisplayTitle}</h2>
          {userIsChannelOwner ? null : (
            <span className='secondary-text'>by {channel.owner}</span>
          )}
        </div>
      )}
      <div className='ChannelHeader-share'>
        {(isUpdating && userIsChannelOwner) ||
        (isEditing && newTitle === '') ? (
          <div className='ChannelHeader-save-wrapper'>
            <MDIconButton
              className='ChannelHeader-button'
              disabled={newTitle === '' || isLoading}
              onClick={() => void handleSubmit()}
            >
              <MDIcon>done</MDIcon>
            </MDIconButton>
          </div>
        ) : (
          <div className='ChannelHeader-share-wrapper'>
            <MDIconButton
              aria-label='Share'
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
