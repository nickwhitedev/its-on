import './App.css'

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser as useClerkUser,
} from '@clerk/clerk-react'
import { useDisableDeviceNotifications } from '../utils/notifications'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ErrorSnackbar from './errors/ErrorSnackbar'
import Home from './Home'
import MDCircularProgress from './material/progress/MDCircularProgress'
import Notifications from './notifications/Notifications'
import Splash from './Splash'
import Support from './support/Support'
import TermsOfUse from './legal/TermsOfUse'
import { baseUrl } from '../utils/urls'
import { useError } from '../contexts/error/errorContext'
import MDOutlinedButton from './material/button/MDOutlinedButton'
import MDFilledTonalButton from './material/button/MDFilledTonalButton'

const App = () => {
  const error = useError()
  const location = useLocation()
  const navigate = useNavigate()
  const disableDeviceNotifications = useDisableDeviceNotifications()

  const { user: clerkUser } = useClerkUser()

  const { pathname, search } = location

  const urlParams = useMemo(() => new URLSearchParams(search), [search])
  const urlParamsAction = urlParams.get('action')

  useEffect(() => {
    void (async () => {
      if (urlParamsAction === 'signedOut') {
        try {
          await disableDeviceNotifications()
        } catch {
          // empty
        }
        navigate('/')
      }
    })()
  }, [disableDeviceNotifications, navigate, urlParams, urlParamsAction])

  const signedOutURLParams = new URLSearchParams()
  for (const [key, value] of Object.entries({
    action: 'signedOut',
    userID: clerkUser?.id ?? '',
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
              userProfileMode='navigation'
              userProfileUrl='/profile'
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
              <TermsOfUse />
            ) : pathname === '/support' ? (
              <Support />
            ) : (
              <>
                <div>
                  <SignInButton mode='modal'>
                    <MDOutlinedButton className='App-auth-button'>
                      Sign In
                    </MDOutlinedButton>
                  </SignInButton>
                  <SignUpButton mode='modal'>
                    <MDFilledTonalButton className='App-auth-button'>
                      Sign Up
                    </MDFilledTonalButton>
                  </SignUpButton>
                </div>
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
