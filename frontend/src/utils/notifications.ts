import { useCallback, useEffect, useState } from 'react'
import { useUser, useUserDispatch } from '../contexts/user/userContext'

import { ErrorDispatchActionType } from '../contexts/error/errorReducer'
import { MS_IN_DAY } from './time'
import { UserDispatchActionType } from '../contexts/user/userReducer'
import { WebkitEvent } from '../components/window/window'
import { getToken } from 'firebase/messaging'
import { messaging } from '../firebase-config'
import { useErrorDispatch } from '../contexts/error/errorContext'
import { useFetchApi } from './api'
import { useSendLog } from './logging'

interface EnableDeviceNotificationsParams {
  savedNotificationTokens: Record<string, { lastUpdated: number }>
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
export const useEnableDeviceNotifications = (): (({
  savedNotificationTokens,
  permissionGranted,
}: EnableDeviceNotificationsParams) => Promise<void>) => {
  const fetchApi = useFetchApi()
  const user = useUser()
  const getNotificationPermission = useGetNotificationPermission()
  // const sendLog = useSendLog()

  const [currentSavedNotificationTokens, setCurrentSavedNotificationTokens] =
    useState<Record<string, { lastUpdated: number }>>({})

  const saveNotificationToken = useCallback(
    (token: string) => {
      if (
        !Object.keys(currentSavedNotificationTokens).includes(token) ||
        currentSavedNotificationTokens[token].lastUpdated <
          Date.now() - MS_IN_DAY * 14
      ) {
        void fetchApi('/enable-device-notifications', 'POST', {
          token,
        })
      }
    },
    [fetchApi, currentSavedNotificationTokens],
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
      savedNotificationTokens,
      permissionGranted = false,
    }: EnableDeviceNotificationsParams): Promise<void> => {
      if (
        !permissionGranted &&
        (getNotificationPermission() !== 'granted' ||
          !(user?.notificationsEnabled ?? true))
      ) {
        return
      }
      setCurrentSavedNotificationTokens(savedNotificationTokens)

      if (window.webkit != null) {
        window.webkit.messageHandlers['push-token'].postMessage('push-token')
        return
      }

      // let token
      // try {
      // eslint-disable-next-line no-console
      console.log(
        'notifications: useEnableDeviceNotifications: getToken: before',
      )
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_PUSH_NOTIFICATION_PUBLIC_KEY as string,
      })
      // eslint-disable-next-line no-console
      console.log(
        'notifications: useEnableDeviceNotifications: getToken: after',
      )
      // } catch (error) {
      //   await sendLog(
      //     'An error occurred while retrieving push notification token. ',
      //     { error },
      //     'ERROR',
      //   )
      //   return
      // }

      saveNotificationToken(token)
    },
    [
      getNotificationPermission,
      saveNotificationToken,
      user?.notificationsEnabled,
    ],
  )
}

/**
 * Hook for registering a notification subscription with the backend.
 */
export const useDisableDeviceNotifications = (): (() => Promise<void>) => {
  const fetchApi = useFetchApi()
  const user = useUser()
  // const sendLog = useSendLog()
  const getIsNotificationPermissionRequestable =
    useGetIsNotificationPermissionRequestable()

  const deleteNotificationToken = useCallback(
    (token: string) => {
      void fetchApi('/disable-device-notifications', 'POST', {
        token,
        userID: user?.id,
      })
    },
    [fetchApi, user?.id],
  )

  useEffect(() => {
    const setPushTokenFromEvent = (event: WebkitEvent) => {
      deleteNotificationToken(JSON.stringify(event.detail))
    }
    if (window.webkit != null) {
      // @ts-expect-error webkit event types are not expected event listener types
      window.addEventListener('push-token', setPushTokenFromEvent)

      return () => {
        // @ts-expect-error webkit event types are not expected event listener types
        removeEventListener('push-token', setPushTokenFromEvent)
      }
    }
  }, [deleteNotificationToken])

  return useCallback(async (): Promise<void> => {
    if (getIsNotificationPermissionRequestable()) {
      return
    }

    if (window.webkit != null) {
      window.webkit.messageHandlers['push-token'].postMessage('push-token')
      return
    }

    // let token
    // try {
    // eslint-disable-next-line no-console
    console.log(
      'notifications: useDisableDeviceNotifications: getToken: before',
    )
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_PUSH_NOTIFICATION_PUBLIC_KEY as string,
    })
    // eslint-disable-next-line no-console
    console.log('notifications: useDisableDeviceNotifications: getToken: after')
    // } catch (error) {
    //   await sendLog(
    //     'An error occurred while retrieving push notification token. ',
    //     { error },
    //     'ERROR',
    //   )
    //   return
    // }

    deleteNotificationToken(token)
  }, [deleteNotificationToken, getIsNotificationPermissionRequestable])
}

/**
 * Hook for requesting and registering notification permissions.
 */
export const useRequestNotificationPermissions = () => {
  const getIsNotificationPermissionRequestable =
    useGetIsNotificationPermissionRequestable()
  const enableDeviceNotifications = useEnableDeviceNotifications()

  const [iOSNotificationPermission, setIOSNotificationPermission] = useState<
    'granted' | 'denied' | 'default'
  >('default')

  const [onPermissionSubmittedFunction, setOnPermissionSubmittedFunction] =
    useState<(isPermissionGranted: boolean) => void>(() => {
      return
    })
  const [savedNotificationTokens, setSavedNotificationTokens] = useState<
    Record<string, { lastUpdated: number }>
  >({})

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

      void enableDeviceNotifications({
        savedNotificationTokens,
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
    enableDeviceNotifications,
    savedNotificationTokens,
  ])

  return useCallback(
    async ({
      savedNotificationTokens,
      onPermissionSubmitted = () => {
        return
      },
    }: EnableDeviceNotificationsParams): Promise<void> => {
      if (!getIsNotificationPermissionRequestable()) {
        return
      }
      setSavedNotificationTokens(savedNotificationTokens)
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

      await enableDeviceNotifications({
        savedNotificationTokens,
        permissionGranted: true,
      })
    },
    [getIsNotificationPermissionRequestable, enableDeviceNotifications],
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
          ? '/disable-all-notifications'
          : '/enable-all-notifications',
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
