import './ProfileMenu.css'

import { fullLogoutUrl, logout } from '../../utils/auth'
import { useUser, useUserDispatch } from '../../contexts/user/userContext'

import MDSwitch from '../material/MDSwitch'
import MDTextButton from '../material/button/MDTextButton'
import { UserDispatchActionType } from '../../contexts/user/userReducer'
import { fetchApi } from '../../utils/api'
import { useCallback } from 'react'

const ProfileMenu = () => {
  const dispatchUser = useUserDispatch()
  const user = useUser()

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

  const handleToggleNotifications = useCallback(
    async (event: Event) => {
      const enabled =
        (event.target as { selected: boolean } | null)?.selected ?? false
      try {
        await fetchApi(
          enabled ? '/disable-notifications' : '/enable-notifications',
          'POST',
        )
        dispatchUser({
          type: enabled
            ? UserDispatchActionType.NOTIFICATIONS_DISABLED
            : UserDispatchActionType.NOTIFICATIONS_ENABLED,
        })
      } catch (error) {
        // TODO: error handling
      }
    },
    [dispatchUser],
  )

  return (
    <div className="ProfileMenu">
      <div className="ProfileMenu-actions">
        <div className="ProfileMenu-action">
          <span className="">Notifications</span>
          <MDSwitch
            selected={notificationsEnabled}
            onChange={event => void handleToggleNotifications(event)}
          />
        </div>
        <MDTextButton
          type="button"
          onClick={() => void handleLogout()}
        >
          Logout
        </MDTextButton>
      </div>
    </div>
  )
}

export default ProfileMenu
