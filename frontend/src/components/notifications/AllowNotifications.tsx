import './AllowNotifications.css'

import { useEffect, useState } from 'react'

import { useErrorDispatch } from '../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import { useSubscriptions } from '../../contexts/subscriptions/subscriptionsContext'
import { useUser } from '../../contexts/user/userContext'
import { useSendLog } from '../../utils/logging'
import { useRequestNotificationPermissions } from '../../utils/notifications'
import MDFilledTonalButton from '../material/button/MDFilledTonalButton'

const AllowNotifications = () => {
  const [showButton, setShowButton] = useState<boolean>(false)

  const subscriptions = useSubscriptions()
  const user = useUser()

  const dispatchError = useErrorDispatch()
  const sendLog = useSendLog()

  const requestNotificationPermissions = useRequestNotificationPermissions()

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
      await sendLog('AllowNotifications error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
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
