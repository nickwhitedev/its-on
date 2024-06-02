import './Channels.css'

import React, { useState } from 'react'
import {
  useChannels,
  useChannelsDispatch,
} from '../../contexts/channels/channelsContext'
import { useUser, useUserDispatch } from '../../contexts/user/userContext'

import { useNavigate } from 'react-router-dom'
import { ChannelsDispatchActionType } from '../../contexts/channels/channelsReducer'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import { UserDispatchActionType } from '../../contexts/user/userReducer'
import { useFetchApi } from '../../utils/api'
import { useSendLog } from '../../utils/logging'
import ItsOnIcon from '../icons/ItsOnIcon'
import MDDivider from '../material/MDDivider'
import MDIcon from '../material/MDIcon'
import MDFilledButton from '../material/button/MDFilledButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import { isChannelOn } from './channel/channelUtils'
import { UPGRADE_PATH } from '../../utils/urls'

const Channels = () => {
  const channels = useChannels()
  const user = useUser()
  const dispatchChannels = useChannelsDispatch()
  const dispatchError = useErrorDispatch()
  const dispatchUser = useUserDispatch()

  const navigate = useNavigate()
  const fetchApi = useFetchApi()
  const sendLog = useSendLog()

  const [isCreating, setIsCreating] = useState<boolean>(false)

  const userHasMaxChannels =
    !(user?.unlimited ?? false) &&
    (user?.channelCount ?? 0) >= (user?.tier ?? 5)

  const handleCreateChannel = async () => {
    setIsCreating(true)

    try {
      const newChannel: IChannel = await fetchApi('/channels', 'POST', {
        title: '',
      })
      dispatchChannels({
        type: ChannelsDispatchActionType.ADDED,
        channel: newChannel,
      })
      dispatchUser({
        type: UserDispatchActionType.CHANNEL_COUNT_INCREASED,
      })
      setIsCreating(false)
      navigate(`/${newChannel.id}`)
    } catch (error) {
      await sendLog('Channels create channel error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
    setIsCreating(false)
  }

  return (
    <div className='Channels'>
      {channels.length === 0 ? (
        <div>
          <div className='Channels-nux-text'>
            Create a channel to let people know when it&apos;s on
          </div>
          <MDFilledButton
            className='Channels-nux-button'
            disabled={isCreating}
            onClick={() => void handleCreateChannel()}
          >
            Create Channel
          </MDFilledButton>
        </div>
      ) : (
        <MDList className='Channels-list'>
          <MDListItem
            className='Channels-list-item'
            disabled={userHasMaxChannels}
            type='button'
            onClick={() => {
              userHasMaxChannels
                ? navigate(`/${UPGRADE_PATH}`)
                : void handleCreateChannel()
            }}
          >
            <MDIcon slot='start'>add</MDIcon>
            <div slot='headline'>New Channel</div>
            {userHasMaxChannels ? (
              <div slot='supporting-text'>
                Channel limit reached - Upgrade to create more channels
              </div>
            ) : null}
          </MDListItem>
          {channels.map(channel => (
            <React.Fragment key={channel.id}>
              <MDDivider inset />
              <MDListItem
                className='Channels-list-item'
                type='link'
                onClick={() => {
                  navigate(`/${channel.id}`)
                }}
              >
                <MDIcon
                  className={
                    isChannelOn(channel)
                      ? 'Channels-list-item-on'
                      : 'Channels-list-item-off'
                  }
                  slot='start'
                >
                  <ItsOnIcon />
                </MDIcon>
                <div slot='headline'>
                  {(channel.title?.length ?? 0) > 0
                    ? channel.title
                    : 'Untitled'}
                </div>
                {(channel.note?.length ?? 0) > 0 ? (
                  <div slot='supporting-text'>{channel.note}</div>
                ) : null}
                <div
                  slot='trailing-supporting-text'
                  className='Channels-list-item-subscribers'
                >
                  <MDIcon>group</MDIcon>
                  {(channel.subscriberCount ?? 0).toLocaleString()}/
                  {(channel.capacity ?? 5).toLocaleString()}
                </div>
              </MDListItem>
            </React.Fragment>
          ))}
        </MDList>
      )}
    </div>
  )
}

export default Channels
