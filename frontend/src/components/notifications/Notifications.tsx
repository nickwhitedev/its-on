import './Notifications.css'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { useUser, useUserDispatch } from '../../contexts/user/userContext'
import { UserDispatchActionType } from '../../contexts/user/userReducer'
import { fetchApi } from '../../utils/api'
import { sendErrorLog } from '../../utils/logging'
import { isChannelOn } from '../channels/channel/channelUtils'
import MDDialog from '../material/MDDialog'
import MDIcon from '../material/MDIcon'
import MDSwitch from '../material/MDSwitch'
import MDTextButton from '../material/button/MDTextButton'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import AllowNotifications from './AllowNotifications'

const Notifications = ({ className }: { className: string }) => {
  const user = useUser()
  const subscriptions = useSubscriptions()

  const dispatchError = useErrorDispatch()
  const dispatchUser = useUserDispatch()
  const navigate = useNavigate()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const notificationsEnabled = user?.notificationsEnabled ?? true
  const onSubscriptions = subscriptions.filter(subscription =>
    isChannelOn(subscription),
  )
  const hasOnSubscriptions = onSubscriptions.length > 0

  const handleToggleNotifications = useCallback(async () => {
    dispatchUser({
      type: notificationsEnabled
        ? UserDispatchActionType.NOTIFICATIONS_DISABLED
        : UserDispatchActionType.NOTIFICATIONS_ENABLED,
    })
    try {
      await fetchApi(
        notificationsEnabled
          ? '/disable-notifications'
          : '/enable-notifications',
        'POST',
      )
    } catch (error) {
      dispatchUser({
        type: notificationsEnabled
          ? UserDispatchActionType.NOTIFICATIONS_ENABLED
          : UserDispatchActionType.NOTIFICATIONS_DISABLED,
      })
      await sendErrorLog('Notifications toggle notifications error', { error })
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
  }, [dispatchError, dispatchUser, notificationsEnabled])

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
          <MDList className='Notifications-list'>
            {hasOnSubscriptions ? (
              <>
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
              </>
            ) : (
              <MDListItem type='text'>
                No subscribed channels are on right now
              </MDListItem>
            )}
            <MDListItem
              type='button'
              onClick={() => void handleToggleNotifications()}
            >
              <div slot='headline'>Notifications</div>
              <div slot='end'>
                <MDSwitch selected={notificationsEnabled} />
              </div>
              {notificationsEnabled &&
              'Notification' in window &&
              Notification.permission === 'denied' ? (
                <div slot='supporting-text'>
                  Notifications are disabled on this device. Go to device
                  settings.
                </div>
              ) : null}
            </MDListItem>
          </MDList>
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
