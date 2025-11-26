import './Notifications.css'

import MDDialog from '../material/MDDialog'
import MDIcon from '../material/MDIcon'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import MDTextButton from '../material/button/MDTextButton'
import { isChannelOn } from '../channels/channel/channelUtils'
import { useNavigate } from 'react-router-dom'
import { useRequestNotificationPermissions } from '../../utils/notifications'
import { useState } from 'react'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { useUser } from '../../contexts/user/userContext'
import { UPDATES_CHANNEL_URL } from '../../utils/urls'
import { UPDATES_CHANNEL_ID } from '../../utils/constants'

const Notifications = ({ className }: { className: string }) => {
  const user = useUser()
  const subscriptions = useSubscriptions()

  const navigate = useNavigate()
  const requestNotificationPermissions = useRequestNotificationPermissions()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const onSubscriptions = subscriptions.filter(subscription =>
    isChannelOn(subscription),
  )
  const hasOnSubscriptions = onSubscriptions.length > 0

  const isSubscribedToUpdatesChannel = subscriptions.some(
    subscription => subscription.id === UPDATES_CHANNEL_ID,
  )

  return (
    <div className={className}>
      <MDIconButton
        className={`Notifications-button ${hasOnSubscriptions ? 'active' : ''}`}
        onClick={() => {
          setIsDialogOpen(previous => !previous)
          void requestNotificationPermissions({
            savedNotificationTokens: user?.notificationTokens ?? {},
          })
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
        <div className='Notifications-headline' slot='headline'>
          <span>Notifications</span>
        </div>
        <div slot='content'>
          <MDList className='Notifications-list'>
            {hasOnSubscriptions ? (
              <>
                {onSubscriptions.map(subscription => (
                  <MDListItem
                    key={subscription.id}
                    type='button'
                    onClick={() => {
                      setIsDialogOpen(false)
                      void navigate(`/${subscription.id}`)
                    }}
                  >
                    <div slot='headline'>
                      {subscription.title ?? 'Untitled Channel'} is on!
                    </div>
                    <div slot='supporting-text'>{subscription.owner}</div>
                  </MDListItem>
                ))}
              </>
            ) : (
              <MDListItem type='text'>
                No subscribed channels are on right now
              </MDListItem>
            )}
          </MDList>
        </div>
        <div slot='actions'>
          {!isSubscribedToUpdatesChannel ? (
            <MDTextButton href={UPDATES_CHANNEL_URL}>Updates</MDTextButton>
          ) : null}
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
