import './AllowNotifications.css'

import { useEffect, useState } from 'react'

import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import MDFilledTonalButton from '../material/button/MDFilledTonalButton'
import { requestNotificationPermissions } from '../../utils/notifications'
import { sendErrorLog } from '../../utils/logging'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { useUser } from '../../contexts/user/userContext'

const AllowNotifications = () => {
  const [showButton, setShowButton] = useState<boolean>(false)

  const subscriptions = useSubscriptions()
  const user = useUser()

  const dispatchError = useErrorDispatch()

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
      await sendErrorLog('AllowNotifications error', { error })
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
  }

  return showButton ? (
    <MDFilledTonalButton
      className="AllowNotifications-button"
      onClick={() => {
        void handleAllowNotifications()
      }}
    >
      Allow Notifications
    </MDFilledTonalButton>
  ) : null
}

export default AllowNotifications
