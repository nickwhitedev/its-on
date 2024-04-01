import './App.css'

import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser as useClerkUser,
} from '@clerk/clerk-react'
import { useUser } from '../contexts/user/userContext'

import ErrorSnackbar from './errors/ErrorSnackbar'
import Notifications from './notifications/Notifications'

import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useError } from '../contexts/error/errorContext'
import { apiUrl, baseUrl } from '../utils/urls'
import Home from './Home'
import TermsOfUse from './legal/TermsOfUse'
import MDTextButton from './material/button/MDTextButton'
import MDCircularProgress from './material/progress/MDCircularProgress'
import Splash from './Splash'
import Support from './support/Support'
import MDIcon from './material/MDIcon'
import MDList from './material/list/MDList'
import MDListItem from './material/list/MDListItem'
import MDSwitch from './material/MDSwitch'
import MDFilledButton from './material/button/MDFilledButton'
import {
  getIsNotificationPermissionRequestable,
  useRequestNotificationPermissions,
  useToggleNotifications,
} from '../utils/notifications'

const App = () => {
  const error = useError()
  const location = useLocation()
  const navigate = useNavigate()
  const requestNotificationPermissions = useRequestNotificationPermissions()
  const toggleNotifications = useToggleNotifications()
  const { user: clerkUser } = useClerkUser()
  const user = useUser()

  const { pathname, search } = location

  const urlParams = useMemo(() => new URLSearchParams(search), [search])
  const urlParamsAction = urlParams.get('action')

  const [
    deviceNotificationPermissionsRequested,
    setDeviceNotificationPermissionsRequested,
  ] = useState<boolean>(false)

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
              userProfileMode='modal'
            >
              <UserButton.UserProfilePage
                label='Notifications'
                url='/notification-settings'
                labelIcon={<MDIcon>notifications</MDIcon>}
              >
                <div>
                  <h1>Notifications</h1>
                  <MDList>
                    <MDListItem>
                      <div slot='headline'>This Device</div>
                      <div slot='supporting-text'>{}</div>
                      <MDFilledButton
                        slot='end'
                        disabled={
                          !getIsNotificationPermissionRequestable() ||
                          deviceNotificationPermissionsRequested
                        }
                        onClick={() =>
                          void requestNotificationPermissions({
                            registeredNotificationSubscriptions:
                              user?.notificationSubscriptions ?? {},
                            onPermissionSubmitted: () => {
                              setDeviceNotificationPermissionsRequested(true)
                            },
                          })
                        }
                      >
                        Enable
                      </MDFilledButton>
                    </MDListItem>
                    <MDListItem>
                      <div slot='headline'>All Notifications</div>
                      <div slot='supporting-text'>
                        Turn on/off notifications on all devices
                      </div>
                      <MDSwitch
                        slot='end'
                        selected={user?.notificationsEnabled ?? true}
                        onClick={() => void toggleNotifications()}
                      />
                    </MDListItem>
                  </MDList>
                </div>
              </UserButton.UserProfilePage>
            </UserButton>
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
