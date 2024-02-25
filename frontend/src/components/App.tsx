import './App.css'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react'
import ErrorSnackbar from './errors/ErrorSnackbar'
import Notifications from './notifications/Notifications'

import { useLocation, useNavigate } from 'react-router-dom'
import { useError } from '../contexts/error/errorContext'
import Home from './Home'
import PrivacyPolicy from './legal/PrivacyPolicy'
import TermsOfUse from './legal/TermsOfUse'
import MDTextButton from './material/button/MDTextButton'
import Splash from './Splash'

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
            navigate('/')
          }}
        >
          It&apos;s On
        </h1>
        <SignedIn>
          <div className='App-settings'>
            <UserButton userProfileMode='modal' />
          </div>
        </SignedIn>
      </header>
      <main className='App-main'>
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
      </main>
      {error.isVisible ? <ErrorSnackbar>{error.message}</ErrorSnackbar> : null}
    </div>
  )
}

export default App
