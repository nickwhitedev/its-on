import './ChannelHeader.css'

import ItsOnIcon from '../../icons/ItsOnIcon'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import ShareChannelButton from './ShareChannelButton'
import { channelDisplayTitle } from './channelUtils'

interface Props {
  channel: IChannel
  isUpdating: boolean
  isOn: boolean
  userIsChannelOwner: boolean
  setIsEditing: (newValue: boolean) => void
}

const ChannelHeader = ({
  channel,
  isUpdating,
  isOn,
  userIsChannelOwner,
  setIsEditing,
}: Props) => {
  return (
    <div className={`ChannelHeader ${userIsChannelOwner ? 'editable' : ''}`}>
      <div className='ChannelHeader-edit'>
        {userIsChannelOwner ? (
          <div className='ChannelHeader-edit-wrapper'>
            <MDIconButton
              className='ChannelHeader-button'
              disabled={false}
              onClick={() => {
                setIsEditing(true)
              }}
            >
              <MDIcon>edit</MDIcon>
            </MDIconButton>
          </div>
        ) : null}
      </div>

      <div className='ChannelHeader-title'>
        <h2 className='ChannelHeader-title'>{channelDisplayTitle(channel)}</h2>
        {userIsChannelOwner ? null : (
          <span className='secondary-text'>by {channel.owner}</span>
        )}
      </div>

      <div className='ChannelHeader-share'>
        {userIsChannelOwner ? (
          <ShareChannelButton
            channel={channel}
            isUpdating={isUpdating}
            size='small'
          />
        ) : null}
      </div>
    </div>
  )
}

export default ChannelHeader
