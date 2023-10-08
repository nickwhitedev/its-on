import './ChannelHeader.css'

import { useState } from 'react'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../utils/api'
import { baseUrl } from '../../../utils/urls'
import MDIcon from '../../material/MDIcon'
import MDFilledTonalIconButton from '../../material/icon-button/MDFilledTonalIconButton'
import MDOutlinedIconButton from '../../material/icon-button/MDOutlinedIconButton'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'

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

  const [newTitle, setNewTitle] = useState<string>(channel.title ?? '')
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const isUpdating = newTitle !== channel.title

  const channelTitle =
    channel.title === '' || channel.title == null ? 'Untitled' : channel.title

  const handleSubmit = async () => {
    if (!isUpdating) return

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
    <div className='ChannelHeader'>
      <div></div>
      {userIsChannelOwner ? (
        <MDOutlinedTextField
          className={'ChannelHeader-input'}
          label='Title'
          maxLength={40}
          rows={1}
          type='textarea'
          value={newTitle}
          onInput={event => {
            setNewTitle((event.target as unknown as { value: string }).value)
          }}
        />
      ) : (
        <h2 className='ChannelHeader-title'>{channelTitle}</h2>
      )}
      <div className='ChannelHeader-actions'>
        {isUpdating && userIsChannelOwner ? (
          <div className='ChannelHeader-edit-actions-wrapper'>
            <MDOutlinedIconButton
              className='ChannelHeader-button'
              disabled={newTitle === '' || isLoading}
              onClick={() => void handleSubmit()}
            >
              <MDIcon>done</MDIcon>
            </MDOutlinedIconButton>
          </div>
        ) : (
          <div className='ChannelHeader-share-wrapper'>
            <MDFilledTonalIconButton
              aria-label='Share'
              disabled={isLoading}
              onClick={() => void handleClickShareChannel()}
              onBlur={() => {
                setChannelCopied(false)
              }}
            >
              <MDIcon>share</MDIcon>
            </MDFilledTonalIconButton>
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
