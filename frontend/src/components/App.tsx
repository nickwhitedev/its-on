import './App.css'

import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import ErrorSnackbar from './errors/ErrorSnackbar'
import Notifications from './notifications/Notifications'
import UserSettings from './user/UserSettings'

import { useError } from '../contexts/error/errorContext'
import Home from './Home'
import MDTextButton from './material/button/MDTextButton'
import Splash from './Splash'

const App = () => {
  const error = useError()

  return (
    <div className='App'>
      <header className='App-header'>
        <SignedIn>
          <Notifications className='App-notifications' />
        </SignedIn>
        <h1>It&apos;s On</h1>
        <SignedIn>
          <UserSettings className='App-settings' />
        </SignedIn>
      </header>
      <main className='App-main'>
        <SignedOut>
          <SignInButton mode='modal'>
            <MDTextButton>Sign In</MDTextButton>
          </SignInButton>
          <Splash />
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
