// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts(
  'https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js',
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js',
)

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: 'AIzaSyDwhgOvR0atmgW4sh8SFnr1iuH0VCEPqeA',
  authDomain: 'its-on-415021.firebaseapp.com',
  projectId: 'its-on-415021',
  storageBucket: 'its-on-415021.appspot.com',
  messagingSenderId: '420616001266',
  appId: '1:420616001266:web:e5ab260246275dc657e26b',
  measurementId: 'G-H6BBNCTWN6',
})

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging()

messaging.onBackgroundMessage(function (payload) {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload,
  )
  // Customize notification here
  const notificationTitle = 'Background Message Title'
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/icon-64.png',
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
