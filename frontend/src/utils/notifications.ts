import { fetchApi } from './api'
import { urlBase64ToUint8Array } from './encoding'

interface registerNotificationSubscriptionParams {
  registeredNotificationSubscriptions: Record<string, PushSubscription>
}

export const registerNotificationSubscription = async ({
  registeredNotificationSubscriptions,
}: registerNotificationSubscriptionParams) => {
  try {
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
      !(
        notificationSubscription.endpoint in
        Object.keys(registeredNotificationSubscriptions)
      )
    ) {
      await fetchApi('/subscribe-notifications', 'POST', {
        subscription: notificationSubscription,
      })
    }
  } catch (error) {
    // TODO: error handling
  }
}
