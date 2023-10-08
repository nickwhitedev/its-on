import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSubscriptions,
  useSubscriptionsDispatch,
} from '../../contexts/subscriptions/subscriptionsContext'
import { SubscriptionsDispatchActionType } from '../../contexts/subscriptions/subscriptionsReducer'
import { fetchApi } from '../../utils/api'
import { isChannelOn } from '../channels/channel/channelUtils'
import ItsOnIcon from '../icons/ItsOnIcon'
import MDDivider from '../material/MDDivider'
import MDIcon from '../material/MDIcon'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import './Subscriptions.css'

const Subscriptions = () => {
  const subscriptions = useSubscriptions()
  const dispatchSubscriptions = useSubscriptionsDispatch()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleClickUnsubscribe = async (channelID: string) => {
    setIsLoading(true)
    try {
      await fetchApi(`/${channelID}/unsubscribe`, 'POST')
      dispatchSubscriptions({
        type: SubscriptionsDispatchActionType.DELETED,
        id: channelID,
      })
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    setIsLoading(false)
  }

  return (
    <div className='Subscriptions'>
      <MDList className='Subscriptions-list'>
        {subscriptions.map((channel, index) => (
          <React.Fragment key={channel.id}>
            {index > 0 ? <MDDivider inset /> : null}
            {channel.deleted ? (
              <MDListItem
                className='Subscriptions-list-item'
                disabled={isLoading}
                key={index}
                type='button'
                onClick={() => void handleClickUnsubscribe(channel.id)}
              >
                <MDIcon
                  className='red'
                  slot='start'
                >
                  delete
                </MDIcon>
                <div slot='headline'>
                  {(channel.title?.length ?? 0) > 0
                    ? channel.title
                    : 'Untitled'}
                </div>
                <div slot='supporting-text'>
                  This channel is no longer available
                </div>
              </MDListItem>
            ) : (
              <MDListItem
                className='Subscriptions-list-item'
                disabled={isLoading}
                key={index}
                type='link'
                onClick={() => {
                  navigate(`/${channel.id}`)
                }}
              >
                <MDIcon
                  className={
                    isChannelOn(channel)
                      ? 'Subscriptions-list-item-on'
                      : 'Subscriptions-list-item-off'
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
                <div slot='supporting-text'>{channel.owner}</div>
              </MDListItem>
            )}
          </React.Fragment>
        ))}
      </MDList>
    </div>
  )
}

export default Subscriptions
