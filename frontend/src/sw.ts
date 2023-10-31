import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, setDefaultHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies'

import { CacheableResponsePlugin } from 'workbox-cacheable-response/CacheableResponsePlugin'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Register precache routes (static cache)
precacheAndRoute(self.__WB_MANIFEST)

// Clean up old cache
cleanupOutdatedCaches()

setDefaultHandler(new NetworkOnly())

// Google fonts dynamic cache
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 5184e3 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET',
)

// Google fonts dynamic cache
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 5184e3 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET',
)

// Dynamic cache for images from `/storage/`
registerRoute(
  /^.*\/.*\.\{js,css,ico,png,svg\}$/,
  new CacheFirst({
    cacheName: 'static-files-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 5184e3 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET',
)

// Dynamic cache for index.html
registerRoute(
  '/index.html',
  new NetworkFirst({
    cacheName: 'index-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 5184e3 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET',
)

// Install and activate service worker
self.addEventListener('install', () => void self.skipWaiting())
self.addEventListener('activate', () => {
  clientsClaim()
})

// Register event listener for the 'push' event.
self.addEventListener('push', function (event) {
  // Retrieve the textual payload from event.data (a PushMessageData object).
  // Other formats are supported (ArrayBuffer, Blob, JSON), check out the documentation
  // on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.
  const payload = event.data ? event.data.text() : 'no payload'

  // Keep the service worker alive until the notification is created.
  event.waitUntil(
    // Show a notification with title "It's On" and use the payload
    // as the body.
    self.registration.showNotification("It's On", {
      body: payload,
    }),
  )
})
