import './ChannelHeader.css'

import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { baseUrl } from '../../../utils/urls'
import { fetchApi } from '../../../utils/api'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { useState } from 'react'

interface Props {
  channel: IChannel
}

const ChannelHeader = ({ channel }: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [newTitle, setNewTitle] = useState<string>(channel.title)
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const channelUpdates = {
        note: channel.note,
        on: channel.on,
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

    setIsSubmitting(false)
  }

  const handleClickShareChannel = async () => {
    const channelURL = `${baseUrl}/${channel.id}`
    try {
      await navigator.share({
        title: `It's On - ${channel.title}`,
        text: `Check out the channel, ${channel.title} by ${channel.owner}`,
        url: channelURL,
      })
    } catch (error) {
      await navigator.clipboard.writeText(channelURL)
      setChannelCopied(true)
    }
  }

  return (
    <div className="ChannelHeader">
      <div className="ChannelHeader-title-actions">
        {isUpdating ? null : (
          <button
            className={'ChannelHeader-button'}
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
          className={'ChannelHeader-input'}
          autoFocus={true}
          disabled={isSubmitting}
          maxLength={40}
          value={newTitle}
          onChange={event => {
            setNewTitle(event.target.value)
          }}
        />
      ) : (
        <h2 className="ChannelHeader-title">{channel.title}</h2>
      )}
      <div className="ChannelHeader-share">
        {isUpdating ? (
          <>
            <button
              className="ChannelHeader-button"
              disabled={newTitle === '' || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              <span className="material-symbols-outlined">done</span>
            </button>
            <button
              className={'ChannelHeader-button'}
              disabled={isSubmitting}
              onClick={() => {
                setIsUpdating(false)
                setNewTitle(channel.title)
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </>
        ) : (
          <div className="ChannelHeader-share-wrapper">
            <button
              onClick={() => void handleClickShareChannel()}
              onBlur={() => {
                setChannelCopied(false)
              }}
              aria-label="Share"
              className="ChannelHeader-share-button"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
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
