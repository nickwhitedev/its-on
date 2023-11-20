import { fetchApi } from './api'
import { urlBase64ToUint8Array } from './encoding'

interface registerNotificationSubscriptionParams {
  registeredNotificationSubscriptions: Record<string, PushSubscription>
}

export const registerNotificationSubscription = async ({
  registeredNotificationSubscriptions,
}: registerNotificationSubscriptionParams): Promise<void> => {
  const registration = await navigator.serviceWorker.ready
  let notificationSubscription =
    await registration.pushManager.getSubscription()

  if (notificationSubscription == null) {
    const response: { publicKey: string } = await fetchApi('/notification-key')
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
}

export const requestNotificationPermissions = async ({
  registeredNotificationSubscriptions,
}: registerNotificationSubscriptionParams): Promise<void> => {
  if (!('Notification' in window && Notification.permission === 'default')) {
    return
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return
  }

  await registerNotificationSubscription({
    registeredNotificationSubscriptions,
  })
}
