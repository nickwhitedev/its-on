import './Channels.css'

import { useNavigate } from 'react-router-dom'
import { useChannels } from '../../contexts/channels/channelsContext'
import ItsOnIcon from '../icons/ItsOnIcon'
import MDDivider from '../material/MDDivider'
import MDIcon from '../material/MDIcon'
import MDList from '../material/MDList'
import MDListItem from '../material/MDListItem'
import CreateChannel from './CreateChannel'
import { isChannelOn } from './channel/channelUtils'

const Channels = () => {
  const channels = useChannels()
  const navigate = useNavigate()

  return (
    <div className={'Channels'}>
      <CreateChannel />
      <MDList>
        {channels.map((channel, index) => (
          <>
            {index > 0 ? <MDDivider></MDDivider> : null}
            <MDListItem
              className={'Channels-list-item'}
              key={index}
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
