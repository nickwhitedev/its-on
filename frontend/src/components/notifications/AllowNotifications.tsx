import { useEffect, useState } from 'react'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { useUser } from '../../contexts/user/userContext'
import { requestNotificationPermissions } from '../../utils/notifications'
import MDFilledTonalButton from '../material/button/MDFilledTonalButton'
import './AllowNotifications.css'

const AllowNotifications = () => {
  const [showButton, setShowButton] = useState<boolean>(false)

  const subscriptions = useSubscriptions()
  const user = useUser()

  useEffect(() => {
    if (
      'Notification' in window &&
      Notification.permission === 'default' &&
      (user?.notificationsEnabled ?? true)
    ) {
      setShowButton(true)
    }
  }, [subscriptions, user])

  const handleAllowNotifications = async () => {
    setShowButton(false)
    try {
      await requestNotificationPermissions({
        registeredNotificationSubscriptions:
          user?.notificationSubscriptions ?? {},
      })
    } catch (error) {
      // TODO: handle error
    }
  }

  return showButton ? (
    <MDFilledTonalButton
      className='AllowNotifications-button'
      onClick={() => {
        void handleAllowNotifications()
      }}
    >
      Allow Notifications
    </MDFilledTonalButton>
  ) : null
}

export default AllowNotifications
