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

  return (
    <div className={className}>
      <MDIconButton
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
          {onSubscriptions.length > 0 ? (
            <MDList className='Notifications-list'>
              {onSubscriptions.map(subscription => (
                <MDListItem
                  key={subscription.id}
                  type='button'
                  onClick={() => {
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
            <p>It&apos;s not on... yet.</p>
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
