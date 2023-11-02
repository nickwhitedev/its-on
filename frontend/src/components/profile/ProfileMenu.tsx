import './ProfileMenu.css'

import { fullLogoutUrl, logout } from '../../utils/auth'

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchApi } from '../../utils/api'
import MDIcon from '../material/MDIcon'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'

const ProfileMenu = () => {
  const navigate = useNavigate()

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
      <MDIconButton
        className='ProfileMenu-back-button'
        onClick={() => {
          navigate('/')
        }}
      >
        <MDIcon>arrow_back</MDIcon>
      </MDIconButton>
      <div className='ProfileMenu-actions'>
        <MDList className='ProfileMenu-actions-list'>
          <MDListItem
            type='button'
            onClick={() => void handleEnableNotifications()}
          >
            Enable Notifications
          </MDListItem>
          <MDListItem
            type='button'
            onClick={() => void handleDisableNotifications()}
          >
            Disable Notifications
          </MDListItem>
          <MDListItem
            type='button'
            onClick={() => void handleLogout()}
          >
            Logout
          </MDListItem>
        </MDList>
      </div>
    </div>
  )
}

export default ProfileMenu
