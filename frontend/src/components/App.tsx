import './App.css'

import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'

import ErrorSnackbar from './errors/ErrorSnackbar'
import Home from './Home'
import MDCircularProgress from './material/progress/MDCircularProgress'
import Notifications from './notifications/Notifications'
import Splash from './Splash'
import Support from './support/Support'
import TermsOfUse from './legal/TermsOfUse'
import { useError } from '../contexts/error/errorContext'
import UserMenu from './user/UserMenu'
import { PRIVACY_PATH, SUPPORT_PATH, TERMS_PATH } from '../utils/urls'
import PrivacyPolicy from './legal/PrivacyPolicy'

const App = () => {
  const error = useError()
  const location = useLocation()
  const navigate = useNavigate()

  const { pathname } = location

  return (
    <div className='App'>
      <header className='App-header'>
        <SignedIn>
          <Notifications className='App-notifications' />
        </SignedIn>
        <h1
          onClick={() => {
            void navigate('/')
          }}
        >
          It&apos;s On
        </h1>
        <SignedIn>
          <div className='App-settings'>
            <UserMenu />
          </div>
        </SignedIn>
      </header>
      <main className='App-main'>
        {pathname === `/${TERMS_PATH}` ? (
          <TermsOfUse />
        ) : pathname === `/${PRIVACY_PATH}` ? (
          <PrivacyPolicy />
        ) : pathname === `/${SUPPORT_PATH}` ? (
          <Support />
        ) : (
          <>
            <ClerkLoading>
              <MDCircularProgress indeterminate />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <Splash />
              </SignedOut>
              <SignedIn>
                <Home />
              </SignedIn>
            </ClerkLoaded>
          </>
        )}
      </main>
      {error.isVisible ? <ErrorSnackbar>{error.message}</ErrorSnackbar> : null}
    </div>
  )
}

export default App
