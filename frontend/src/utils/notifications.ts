import { useCallback, useEffect, useState } from 'react'
import { useUser, useUserDispatch } from '../contexts/user/userContext'
import { useFetchApi } from './api'
import { useSendLog } from './logging'
import { useErrorDispatch } from '../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../contexts/error/errorReducer'
import { UserDispatchActionType } from '../contexts/user/userReducer'
import { WebkitEvent } from '../components/window/window'
import { getToken } from 'firebase/messaging'
import { messaging } from '../firebase-config'

interface registerNotificationSubscriptionParams {
  registeredNotificationSubscriptions: Set<string>
  permissionGranted?: boolean
  onPermissionSubmitted?: (isPermissionGranted: boolean) => void
}

export const useGetNotificationPermission = (): (() =>
  | 'granted'
  | 'denied'
  | 'default') => {
  const [iOSNotificationPermission, setIOSNotificationPermission] = useState<
    'granted' | 'denied' | 'default'
  >('default')

  useEffect(() => {
    const parseWebkitPermissionState = (event: WebkitEvent) => {
      switch (event.detail) {
        case 'notDetermined':
          setIOSNotificationPermission('default')
          break
        case 'denied':
          setIOSNotificationPermission('denied')
          break
        case 'authorized':
        case 'ephemeral':
        case 'provisional':
          setIOSNotificationPermission('granted')
          break
        case 'unknown':
        default:
          break
      }
    }

    if (window.webkit != null) {
      // @ts-expect-error webkit event types are not expected event listener types
      window.addEventListener(
        'push-permission-state',
        parseWebkitPermissionState,
      )
      window.webkit.messageHandlers['push-permission-state'].postMessage(
        'push-permission-state',
      )
      return () => {
        // @ts-expect-error webkit event types are not expected event listener types
        removeEventListener('push-permission-state', parseWebkitPermissionState)
      }
    }
  }, [])

  return useCallback((): 'granted' | 'denied' | 'default' => {
    if (window.webkit != null) {
      return iOSNotificationPermission
    } else if ('Notification' in window) {
      return Notification.permission
    } else {
      return 'denied'
    }
  }, [iOSNotificationPermission])
}

export const useGetIsNotificationPermissionRequestable =
  (): (() => boolean) => {
    const getNotificationPermission = useGetNotificationPermission()

    return () => getNotificationPermission() === 'default'
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
  const getNotificationPermission = useGetNotificationPermission()
  const sendLog = useSendLog()

  const [savedNotificationTokens, setSavedNotificationTokens] = useState<
    Set<string>
  >(new Set([]))

  const saveNotificationToken = useCallback(
    (token: string) => {
      if (!Object.keys(savedNotificationTokens).includes(token)) {
        void fetchApi('/subscribe-notifications', 'POST', {
          token,
        })
      }
    },
    [fetchApi, savedNotificationTokens],
  )

  useEffect(() => {
    const setPushTokenFromEvent = (event: WebkitEvent) => {
      saveNotificationToken(JSON.stringify(event.detail))
    }
    if (window.webkit != null) {
      // @ts-expect-error webkit event types are not expected event listener types
      window.addEventListener('push-token', setPushTokenFromEvent)

      return () => {
        // @ts-expect-error webkit event types are not expected event listener types
        removeEventListener('push-token', setPushTokenFromEvent)
      }
    }
  }, [saveNotificationToken])

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
      setSavedNotificationTokens(registeredNotificationSubscriptions)

      if (window.webkit != null) {
        window.webkit.messageHandlers['push-token'].postMessage('push-token')
        return
      }

      let token
      try {
        token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_PUSH_NOTIFICATION_PUBLIC_KEY as string,
        })
      } catch (error) {
        await sendLog(
          'An error occurred while retrieving push notification token. ',
          { error },
          'ERROR',
        )
        return
      }

      saveNotificationToken(token)
    },
    [
      getNotificationPermission,
      saveNotificationToken,
      sendLog,
      user?.notificationsEnabled,
    ],
  )
}

/**
 * Hook for requesting and registering notification permissions.
 */
export const useRequestNotificationPermissions = () => {
  const getIsNotificationPermissionRequestable =
    useGetIsNotificationPermissionRequestable()
  const registerNotificationSubscription = useRegisterNotificationSubscription()

  const [iOSNotificationPermission, setIOSNotificationPermission] = useState<
    'granted' | 'denied' | 'default'
  >('default')

  const [onPermissionSubmittedFunction, setOnPermissionSubmittedFunction] =
    useState<(isPermissionGranted: boolean) => void>(() => {
      return
    })
  const [
    registeredNotificationPushSubscriptions,
    setRegisteredNotificationPushSubscriptions,
  ] = useState<Set<string>>(new Set([]))

  useEffect(() => {
    const pushWebkitNotificationPermissionRequest = (event: WebkitEvent) => {
      switch (event.detail) {
        case 'granted':
          setIOSNotificationPermission('granted')
          break
        default:
          setIOSNotificationPermission('denied')
          break
      }

      if (iOSNotificationPermission !== 'granted') {
        onPermissionSubmittedFunction(false)
        return
      }
      onPermissionSubmittedFunction(true)

      void registerNotificationSubscription({
        registeredNotificationSubscriptions:
          registeredNotificationPushSubscriptions,
        permissionGranted: true,
      })
    }

    if (window.webkit != null) {
      // @ts-expect-error webkit event types are not expected event listener types
      window.addEventListener(
        'push-permission-request',
        pushWebkitNotificationPermissionRequest,
      )
    }

    return () => {
      removeEventListener(
        'push-permission-request',
        // @ts-expect-error webkit event types are not expected event listener types
        pushWebkitNotificationPermissionRequest,
      )
    }
  }, [
    iOSNotificationPermission,
    onPermissionSubmittedFunction,
    registerNotificationSubscription,
    registeredNotificationPushSubscriptions,
  ])

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
      setRegisteredNotificationPushSubscriptions(
        registeredNotificationSubscriptions,
      )
      setOnPermissionSubmittedFunction(onPermissionSubmitted)

      if (window.webkit != null) {
        window.webkit.messageHandlers['push-permission-request'].postMessage(
          'push-permission-request',
        )
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
    [getIsNotificationPermissionRequestable, registerNotificationSubscription],
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
