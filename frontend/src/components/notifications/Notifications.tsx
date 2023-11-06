import './Notifications.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { isChannelOn } from '../channels/channel/channelUtils'
import MDDialog from '../material/MDDialog'
import MDIcon from '../material/MDIcon'
import MDTextButton from '../material/button/MDTextButton'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import AllowNotifications from './AllowNotifications'

const Notifications = ({ className }: { className: string }) => {
  const subscriptions = useSubscriptions()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const onSubscriptions = subscriptions.filter(subscription =>
    isChannelOn(subscription),
  )
  const hasOnSubscriptions = onSubscriptions.length > 0

  return (
    <div className={className}>
      <MDIconButton
        className={`Notifications-button ${hasOnSubscriptions ? 'active' : ''}`}
        onClick={() => {
          setIsDialogOpen(previous => !previous)
        }}
      >
        <MDIcon>notifications</MDIcon>
      </MDIconButton>
      <MDDialog
        className='Notifications-dialog'
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
        }}
      >
        <div slot='headline'>Notifications</div>
        <div slot='content'>
          <AllowNotifications />
          {hasOnSubscriptions ? (
            <MDList className='Notifications-list'>
              {onSubscriptions.map(subscription => (
                <MDListItem
                  key={subscription.id}
                  type='button'
                  onClick={() => {
                    setIsDialogOpen(false)
                    navigate(`/${subscription.id}`)
                  }}
                >
                  <div slot='headline'>
                    {subscription.title ?? 'Untitled Channel'} is on!
                  </div>
                  <div slot='supporting-text'>{subscription.owner}</div>
                </MDListItem>
              ))}
            </MDList>
          ) : (
            <p>No channels are on right now</p>
          )}
        </div>
        <div slot='actions'>
          <MDTextButton
            onClick={() => {
              setIsDialogOpen(false)
            }}
          >
            Close
          </MDTextButton>
        </div>
      </MDDialog>
    </div>
  )
}

export default Notifications
