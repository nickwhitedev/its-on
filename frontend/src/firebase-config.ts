import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyDwhgOvR0atmgW4sh8SFnr1iuH0VCEPqeA',
  authDomain: 'its-on-415021.firebaseapp.com',
  projectId: 'its-on-415021',
  storageBucket: 'its-on-415021.appspot.com',
  messagingSenderId: '420616001266',
  appId: '1:420616001266:web:e5ab260246275dc657e26b',
  measurementId: 'G-H6BBNCTWN6',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const messaging = getMessaging(app)
