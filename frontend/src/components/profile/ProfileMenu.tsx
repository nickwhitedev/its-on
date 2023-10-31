import './ProfileMenu.css'

import { fullLogoutUrl, logout } from '../../utils/auth'

import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchApi } from '../../utils/api'

const ProfileMenu = () => {
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

  const handleEnableNotifications = useCallback(async () => {
    try {
      await fetchApi('/enable-notifications', 'POST')
    } catch (error) {
      // TODO: error handling
    }
  }, [])

  const handleDisableNotifications = useCallback(async () => {
    try {
      await fetchApi('/disable-notifications', 'POST')
    } catch (error) {
      // TODO: error handling
    }
  }, [])

  return (
    <div className='ProfileMenu'>
      <Link
        to={'/'}
        className='icon'
      >
        <span className='material-symbols-outlined'>arrow_back</span>
      </Link>
      <button onClick={void handleEnableNotifications}>
        Enable Notifications
      </button>
      <button onClick={void handleDisableNotifications}>
        Disable Notifications
      </button>
      <button onClick={void handleLogout}>Logout</button>
    </div>
  )
}

export default ProfileMenu
