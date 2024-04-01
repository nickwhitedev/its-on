import { useCallback } from 'react'
import { useUser, useUserDispatch } from '../contexts/user/userContext'
import { useFetchApi } from './api'
import { urlBase64ToUint8Array } from './encoding'
import { useSendLog } from './logging'
import { useErrorDispatch } from '../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../contexts/error/errorReducer'
import { UserDispatchActionType } from '../contexts/user/userReducer'

interface registerNotificationSubscriptionParams {
  registeredNotificationSubscriptions: Record<string, PushSubscription>
  permissionGranted?: boolean
  onPermissionSubmitted?: (isPermissionGranted: boolean) => void
}

// const [iOSPushCapability, setIOSPushCapability] = useState<boolean>(
//   window.webkit != null,
// )

const getNotificationPermission = () => {
  if ('Notification' in window) {
    return Notification.permission
  }
  return 'denied'
}

export const getIsNotificationPermissionRequestable = () => {
  return getNotificationPermission() === 'default'
}

/**
 * Hook for registering a notification subscription with the backend.
 */
export const useRegisterNotificationSubscription = (): (({
  registeredNotificationSubscriptions,
  permissionGranted,
}: registerNotificationSubscriptionParams) => Promise<void>) => {
  const fetchApi = useFetchApi()
  const user = useUser()

  return useCallback(
    async ({
      registeredNotificationSubscriptions,
      permissionGranted = false,
    }: registerNotificationSubscriptionParams): Promise<void> => {
      if (
        !permissionGranted &&
        (getNotificationPermission() !== 'granted' ||
          !(user?.notificationsEnabled ?? true))
      ) {
        return
      }
      const registration = await navigator.serviceWorker.ready
      let notificationSubscription =
        await registration.pushManager.getSubscription()

      if (notificationSubscription == null) {
        const response: { publicKey: string } = await fetchApi(
          '/notification-key',
        )
        const convertedVapidKey = urlBase64ToUint8Array(response.publicKey)
        notificationSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })
      }

      if (
        !Object.keys(registeredNotificationSubscriptions).includes(
          notificationSubscription.endpoint,
        )
      ) {
        await fetchApi('/subscribe-notifications', 'POST', {
          subscription: notificationSubscription,
        })
      }
    },
    [fetchApi, user?.notificationsEnabled],
  )
}

/**
 * Hook for requesting and registering notification permissions.
 */
export const useRequestNotificationPermissions = () => {
  const registerNotificationSubscription = useRegisterNotificationSubscription()

  return useCallback(
    async ({
      registeredNotificationSubscriptions,
      onPermissionSubmitted = () => {
        return
      },
    }: registerNotificationSubscriptionParams): Promise<void> => {
      if (!getIsNotificationPermissionRequestable()) {
        return
      }

      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        onPermissionSubmitted(false)
        return
      }
      onPermissionSubmitted(true)

      await registerNotificationSubscription({
        registeredNotificationSubscriptions,
        permissionGranted: true,
      })
    },
    [registerNotificationSubscription],
  )
}

export const useToggleNotifications = () => {
  const fetchApi = useFetchApi()
  const sendLog = useSendLog()
  const user = useUser()
  const dispatchUser = useUserDispatch()
  const dispatchError = useErrorDispatch()

  return useCallback(async () => {
    const userNotificationsEnabled = user?.notificationsEnabled ?? true

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
    dispatchError,
    dispatchUser,
    fetchApi,
    sendLog,
    user?.notificationsEnabled,
  ])
}
