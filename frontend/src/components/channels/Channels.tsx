import './Channels.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useChannels,
  useChannelsDispatch,
} from '../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../contexts/channels/channelsReducer'
import { fetchApi } from '../../utils/api'
import ItsOnIcon from '../icons/ItsOnIcon'
import MDDivider from '../material/MDDivider'
import MDElevation from '../material/MDElevation'
import MDIcon from '../material/MDIcon'
import MDList from '../material/MDList'
import MDListItem from '../material/MDListItem'
import { isChannelOn } from './channel/channelUtils'

const Channels = () => {
  const channels = useChannels()
  const dispatch = useChannelsDispatch()

  const navigate = useNavigate()

  const [isCreating, setIsCreating] = useState<boolean>(false)

  const handleCreateChannel = async () => {
    setIsCreating(true)

    try {
      const newChannel: IChannel = await fetchApi('/channels', 'POST', {
        title: '',
      })
      dispatch({
        type: ChannelsDispatchActionType.ADDED,
        channel: newChannel,
      })
      setIsCreating(false)
      navigate(`/${newChannel.id}`)
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    setIsCreating(false)
  }

  return (
    <div className='Channels'>
      <MDElevation />
      <MDList className='Channels-list'>
        <MDListItem
          className='Channels-list-item'
          disabled={isCreating}
          type='button'
          onClick={() => void handleCreateChannel()}
        >
          <MDIcon slot='start'>add</MDIcon>
          <div slot='headline'>Create Channel</div>
        </MDListItem>
        {channels.map(channel => (
          <>
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
                {(channel.title?.length ?? 0) > 0 ? channel.title : 'Untitled'}
              </div>
              {(channel.note?.length ?? 0) > 0 ? (
                <div slot='supporting-text'>{channel.note}</div>
              ) : null}
            </MDListItem>
          </>
        ))}
      </MDList>
    </div>
  )
}

export default Channels
