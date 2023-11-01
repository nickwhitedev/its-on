import { useCallback, useEffect, useState } from 'react'
import { useSubscriptions } from '../contexts/subscriptions/subscriptionsContext'
import { useUser } from '../contexts/user/userContext'
import { fetchApi } from '../utils/api'
import { urlBase64ToUint8Array } from '../utils/encoding'
import MDDialog from './material/MDDialog'
import MDTextButton from './material/button/MDTextButton'

const AllowNotifications = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null)

  const subscriptions = useSubscriptions()
  const user = useUser()

  const syncDeviceNotificationSettings = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      setServiceWorkerRegistration(registration)
      const notificationSubscription =
        await registration.pushManager.getSubscription()
      if (notificationSubscription == null) {
        setIsDialogOpen(true)
      }
    } catch (error) {
      // TODO: handle error
    }
  }, [])

  useEffect(() => {
    if (!('Notification' in window)) return
    if (
      Notification.permission === 'default' &&
      subscriptions.length > 0 &&
      (user?.notificationsEnabled ?? true)
    ) {
      void syncDeviceNotificationSettings()
    }
  }, [subscriptions, syncDeviceNotificationSettings, user])

  const handleAllowNotifications = async () => {
    setIsLoading(true)

    const permission = await Notification.requestPermission()

    setIsLoading(false)
    setIsDialogOpen(false)

    if (permission !== 'granted') {
      return
    }

    try {
      const response: { publicKey: string } = await fetchApi(
        '/notification-key',
      )
      const convertedVapidKey = urlBase64ToUint8Array(response.publicKey)

      const deviceNotificationSubscription =
        await serviceWorkerRegistration?.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })
      await fetchApi('/subscribe-notifications', 'POST', {
        subscription: deviceNotificationSubscription,
      })
    } catch (error) {
      // TODO: error handling
    }
  }

  const handleDisallowNotifications = async () => {
    setIsLoading(true)

    await fetchApi('/disable-notifications', 'POST')

    setIsLoading(false)
    setIsDialogOpen(false)
  }

  return (
    <MDDialog
      open={isDialogOpen}
      onClose={() => {
        void handleDisallowNotifications()
      }}
    >
      <div slot='headline'>Allow Notifications</div>
      <div slot='content'>
        <p>
          Stay in the loop and let channels that you subscribe to notify you
          when It&apos;s On!
        </p>
        <p>This can be changed in settings.</p>
      </div>
      <div slot='actions'>
        <MDTextButton
          disabled={isLoading}
          onClick={() => {
            void handleDisallowNotifications()
          }}
        >
          No
        </MDTextButton>
        <MDTextButton
          disabled={isLoading}
          onClick={() => void handleAllowNotifications()}
        >
          Yes
        </MDTextButton>
      </div>
    </MDDialog>
  )
}

export default AllowNotifications
