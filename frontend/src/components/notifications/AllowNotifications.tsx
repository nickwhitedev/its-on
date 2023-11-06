import { useEffect, useState } from 'react'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { useUser } from '../../contexts/user/userContext'
import { registerNotificationSubscription } from '../../utils/notifications'
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
      subscriptions.length > 0 &&
      (user?.notificationsEnabled ?? true)
    ) {
      setShowButton(true)
    }
  }, [subscriptions, user])

  const handleAllowNotifications = async () => {
    const permission = await Notification.requestPermission()
    setShowButton(false)

    if (permission !== 'granted') {
      return
    }

    await registerNotificationSubscription({
      registeredNotificationSubscriptions:
        user?.notificationSubscriptions ?? {},
    })
  }

  return showButton ? (
    <MDFilledTonalButton
      className='AllowNotifications-button'
      onClick={() => {
        void handleAllowNotifications()
      }}
    >
      Allow Notifiations
    </MDFilledTonalButton>
  ) : null
}

export default AllowNotifications
