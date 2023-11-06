import './UserSettings.css'

import { useUser, useUserDispatch } from '../../contexts/user/userContext'
import { fullLogoutUrl, logout } from '../../utils/auth'

import { useCallback, useState } from 'react'
import { UserDispatchActionType } from '../../contexts/user/userReducer'
import { fetchApi } from '../../utils/api'
import MDDialog from '../material/MDDialog'
import MDIcon from '../material/MDIcon'
import MDSwitch from '../material/MDSwitch'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'

const UserSettings = ({ className }: { className: string }) => {
  const dispatchUser = useUserDispatch()
  const user = useUser()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const notificationsEnabled = user?.notificationsEnabled === true

  const handleLogout = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription != null) {
        await subscription.unsubscribe()
        await fetchApi(
          '/unsubscribe-notifications',
          'POST',
          { subscription },
          true,
        )
      }
    } catch (error) {
      // TODO: error handling
    }
    logout()
    window.location.assign(fullLogoutUrl)
  }, [])

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
      // TODO: error handling
    }
  }, [dispatchUser, notificationsEnabled])

  return (
    <div className={className}>
      <MDIconButton
        aria-label='Account Settings'
        onClick={() => {
          setIsDialogOpen(previous => !previous)
        }}
      >
        <MDIcon>account_circle</MDIcon>
      </MDIconButton>
      <MDDialog
        className='UserSettings-dialog'
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
        }}
      >
        <div slot='headline'>Settings</div>
        <div slot='content'>
          <MDList className='UserSettings-list'>
            <MDListItem
              type='button'
              onClick={() => void handleToggleNotifications()}
            >
              <div slot='headline'>Notifications</div>
              <div slot='end'>
                <MDSwitch selected={notificationsEnabled} />
              </div>
              {notificationsEnabled && Notification.permission === 'denied' ? (
                <div slot='supporting-text'>
                  Notifications are disabled on this device. Go to device
                  settings.
                </div>
              ) : null}
            </MDListItem>
            <MDListItem
              type='button'
              onClick={() => void handleLogout()}
            >
              <div slot='headline'>Logout</div>
            </MDListItem>
          </MDList>
        </div>
      </MDDialog>
    </div>
  )
}

export default UserSettings
