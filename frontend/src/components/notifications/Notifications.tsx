import './Notifications.css'

import { useCallback, useState } from 'react'
import { useUser, useUserDispatch } from '../../contexts/user/userContext'

import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import MDDialog from '../material/MDDialog'
import MDIcon from '../material/MDIcon'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import MDSwitch from '../material/MDSwitch'
import MDTextButton from '../material/button/MDTextButton'
import { UserDispatchActionType } from '../../contexts/user/userReducer'
import { isChannelOn } from '../channels/channel/channelUtils'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { useFetchApi } from '../../utils/api'
import { useNavigate } from 'react-router-dom'
import { useRequestNotificationPermissions } from '../../utils/notifications'
import { useSendLog } from '../../utils/logging'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'

const Notifications = ({ className }: { className: string }) => {
  const user = useUser()
  const subscriptions = useSubscriptions()

  const dispatchError = useErrorDispatch()
  const dispatchUser = useUserDispatch()

  const navigate = useNavigate()
  const fetchApi = useFetchApi()
  const sendLog = useSendLog()
  const requestNotificationPermissions = useRequestNotificationPermissions()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [
    deviceNotificationPermissionsUnrequested,
    setDeviceNotificationPermissionsUnrequested,
  ] = useState<boolean>(
    'Notification' in window && Notification.permission === 'default',
  )

  const userNotificationsEnabled = user?.notificationsEnabled ?? true

  const onSubscriptions = subscriptions.filter(subscription =>
    isChannelOn(subscription),
  )
  const hasOnSubscriptions = onSubscriptions.length > 0

  const handleToggleNotifications = useCallback(async () => {
    const onlyEnableDeviceNotifications =
      deviceNotificationPermissionsUnrequested && userNotificationsEnabled

    if (deviceNotificationPermissionsUnrequested) {
      try {
        await requestNotificationPermissions({
          registeredNotificationSubscriptions:
            user?.notificationSubscriptions ?? {},
        })
        setDeviceNotificationPermissionsUnrequested(false)
      } catch (error) {
        await sendLog('AllowNotifications error', { error }, 'ERROR')
        dispatchError({
          type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
        })
      }
    }

    if (onlyEnableDeviceNotifications) {
      return
    }

    try {
      await fetchApi(
        userNotificationsEnabled
          ? '/disable-notifications'
          : '/enable-notifications',
        'POST',
      )
    } catch (error) {
      await sendLog(
        'Notifications toggle notifications error',
        { error },
        'ERROR',
      )
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
    dispatchUser({
      type: userNotificationsEnabled
        ? UserDispatchActionType.NOTIFICATIONS_DISABLED
        : UserDispatchActionType.NOTIFICATIONS_ENABLED,
    })
  }, [
    deviceNotificationPermissionsUnrequested,
    dispatchError,
    dispatchUser,
    fetchApi,
    requestNotificationPermissions,
    sendLog,
    user?.notificationSubscriptions,
    userNotificationsEnabled,
  ])

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
        <div
          className='Notifications-headline'
          slot='headline'
        >
          <span>Notifications</span>
          <MDSwitch
            selected={
              !deviceNotificationPermissionsUnrequested &&
              userNotificationsEnabled
            }
            onClick={() => void handleToggleNotifications()}
          />
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
