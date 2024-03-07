import './App.css'

import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react'
import ErrorSnackbar from './errors/ErrorSnackbar'
import Notifications from './notifications/Notifications'

import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useError } from '../contexts/error/errorContext'
import { apiUrl, baseUrl } from '../utils/urls'
import Home from './Home'
import PrivacyPolicy from './legal/PrivacyPolicy'
import TermsOfUse from './legal/TermsOfUse'
import MDTextButton from './material/button/MDTextButton'
import MDCircularProgress from './material/progress/MDCircularProgress'
import Splash from './Splash'

const App = () => {
  const error = useError()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUser()

  const { pathname, search } = location

  const urlParams = useMemo(() => new URLSearchParams(search), [search])
  const urlParamsAction = urlParams.get('action')

  useEffect(() => {
    void (async () => {
      if (urlParamsAction === 'signedOut') {
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          if (subscription != null) {
            await subscription.unsubscribe()
            void fetch(`${apiUrl}/unsubscribe-notifications`, {
              body: JSON.stringify({
                userID: urlParams.get('userID') ?? '',
                subscription,
              }),
              method: 'POST',
            })
          }
        } catch {
          // empty
        }
        navigate('/')
      }
    })()
  }, [navigate, urlParams, urlParamsAction])

  const signedOutURLParams = new URLSearchParams()
  for (const [key, value] of Object.entries({
    action: 'signedOut',
    userID: user?.id ?? '',
  })) {
    signedOutURLParams.append(key, value)
  }

  return (
    <div className='App'>
      <header className='App-header'>
        <SignedIn>
          <Notifications className='App-notifications' />
        </SignedIn>
        <h1
          onClick={() => {
            navigate('/')
          }}
        >
          It&apos;s On
        </h1>
        <SignedIn>
          <div className='App-settings'>
            <UserButton
              afterSignOutUrl={`${baseUrl}/?${signedOutURLParams.toString()}`}
              userProfileMode='modal'
            />
          </div>
        </SignedIn>
      </header>
      <main className='App-main'>
        <ClerkLoading>
          <MDCircularProgress indeterminate />
        </ClerkLoading>
        <ClerkLoaded>
          <SignedOut>
            {pathname === '/terms' ? (
              <TermsOfUse />
            ) : pathname === '/privacy' ? (
              <PrivacyPolicy />
            ) : (
              <>
                <SignInButton mode='modal'>
                  <MDTextButton>Sign In</MDTextButton>
                </SignInButton>
                <Splash />
              </>
            )}
          </SignedOut>
          <SignedIn>
            <Home />
          </SignedIn>
        </ClerkLoaded>
      </main>
      {error.isVisible ? <ErrorSnackbar>{error.message}</ErrorSnackbar> : null}
    </div>
  )
}

export default App
