import './ChannelHeader.css'

import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'
import { baseUrl } from '../../../utils/urls'
import { fetchApi } from '../../../utils/api'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { useState } from 'react'

interface Props {
  channel: IChannel
  isLoading: boolean
  userIsChannelOwner: boolean
  setIsLoading: (newValue: boolean) => void
}

const ChannelHeader = ({
  channel,
  isLoading,
  userIsChannelOwner,
  setIsLoading,
}: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const [isUpdating, setIsUpdating] = useState<boolean>(
    userIsChannelOwner && !channel.title,
  )
  const [newTitle, setNewTitle] = useState<string>(channel.title ?? '')
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const channelTitle =
    channel.title === '' || channel.title == null ? 'Untitled' : channel.title

  const handleSubmit = async () => {
    if (newTitle === channel.title) {
      setIsUpdating(false)
      return
    }
    setIsLoading(true)

    try {
      const channelUpdates = {
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
      setIsUpdating(false)
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
        title: `It's On - ${channelTitle}`,
        text: `Check out the channel, ${channelTitle} by ${channel.owner}`,
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
            {isUpdating ? (
              <MDIconButton
                className="ChannelHeader-button"
                disabled={!channel.title || isLoading}
                onClick={() => {
                  setIsUpdating(false)
                  setNewTitle(channel.title ?? '')
                }}
              >
                <MDIcon>close</MDIcon>
              </MDIconButton>
            ) : (
              <MDIconButton
                className="ChannelHeader-button"
                disabled={false}
                onClick={() => {
                  setIsUpdating(true)
                }}
              >
                <MDIcon>edit</MDIcon>
              </MDIconButton>
            )}
          </div>
        ) : null}
      </div>
      {userIsChannelOwner && isUpdating ? (
        <MDOutlinedTextField
          // TODO: Implement autoFocus with ref
          className={'ChannelHeader-input'}
          label="Title"
          maxLength={40}
          rows={1}
          type="textarea"
          value={newTitle}
          onInput={event => {
            setNewTitle((event.target as unknown as { value: string }).value)
          }}
        />
      ) : (
        <div className="ChannelHeader-title">
          <h2 className="ChannelHeader-title">{channelTitle}</h2>
          {userIsChannelOwner ? null : (
            <span className="secondary-text">by {channel.owner}</span>
          )}
        </div>
      )}
      <div className="ChannelHeader-share">
        {isUpdating && userIsChannelOwner ? (
          <div className="ChannelHeader-save-wrapper">
            <MDIconButton
              className="ChannelHeader-button"
              disabled={newTitle === '' || isLoading}
              onClick={() => void handleSubmit()}
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
