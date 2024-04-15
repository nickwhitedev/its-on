import './App.css'

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser as useClerkUser,
} from '@clerk/clerk-react'
import {
  useDisableDeviceNotifications,
  useGetIsNotificationPermissionRequestable,
  useGetNotificationPermission,
  useRequestNotificationPermissions,
  useToggleNotifications,
} from '../utils/notifications'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ErrorSnackbar from './errors/ErrorSnackbar'
import Home from './Home'
import MDCircularProgress from './material/progress/MDCircularProgress'
import MDFilledButton from './material/button/MDFilledButton'
import MDIcon from './material/MDIcon'
import MDList from './material/list/MDList'
import MDListItem from './material/list/MDListItem'
import MDSwitch from './material/MDSwitch'
import MDTextButton from './material/button/MDTextButton'
import Notifications from './notifications/Notifications'
import Splash from './Splash'
import Support from './support/Support'
import TermsOfUse from './legal/TermsOfUse'
import { baseUrl } from '../utils/urls'
import { useError } from '../contexts/error/errorContext'
import { useUser } from '../contexts/user/userContext'

const App = () => {
  const error = useError()
  const location = useLocation()
  const navigate = useNavigate()
  const requestNotificationPermissions = useRequestNotificationPermissions()
  const toggleNotifications = useToggleNotifications()
  const getNotificationPermission = useGetNotificationPermission()
  const getIsNotificationPermissionRequestable =
    useGetIsNotificationPermissionRequestable()
  const disableDeviceNotifications = useDisableDeviceNotifications()

  const { user: clerkUser } = useClerkUser()
  const user = useUser()

  const { pathname, search } = location

  const urlParams = useMemo(() => new URLSearchParams(search), [search])
  const urlParamsAction = urlParams.get('action')

  const [deviceNotificationPermission, setDeviceNotificationPermission] =
    useState<string>(getNotificationPermission())

  const [
    deviceNotificationPermissionsRequested,
    setDeviceNotificationPermissionsRequested,
  ] = useState<boolean>(false)

  const [isLoadingToggleNotifications, setIsLoadingToggleNotifications] =
    useState<boolean>(false)

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
              userProfileMode='modal'
            >
              <UserButton.UserProfilePage
                label='Notifications'
                url='/notification-settings'
                labelIcon={<MDIcon>notifications</MDIcon>}
              >
                <div>
                  <h1>Notifications</h1>
                  <MDList className='App-settings-list'>
                    <MDListItem>
                      <div slot='headline'>This Device</div>
                      <div slot='supporting-text'>
                        {deviceNotificationPermission === 'granted'
                          ? 'Notifications are enabled on this device'
                          : deviceNotificationPermission === 'denied'
                          ? 'Go to device settings to enable notifications'
                          : 'Enable notifications on this device'}
                      </div>
                      <MDFilledButton
                        slot='end'
                        disabled={
                          !getIsNotificationPermissionRequestable() ||
                          deviceNotificationPermissionsRequested ||
                          !(user?.notificationsEnabled ?? true)
                        }
                        onClick={() =>
                          void requestNotificationPermissions({
                            savedNotificationTokens:
                              user?.notificationTokens ?? {},
                            onPermissionSubmitted: (
                              isPermissionGranted: boolean,
                            ) => {
                              setDeviceNotificationPermissionsRequested(true)
                              setDeviceNotificationPermission(
                                isPermissionGranted ? 'granted' : 'denied',
                              )
                            },
                          })
                        }
                      >
                        {deviceNotificationPermission === 'granted'
                          ? 'Enabled'
                          : deviceNotificationPermission === 'denied'
                          ? 'Disabled'
                          : 'Enable'}
                      </MDFilledButton>
                    </MDListItem>
                    <MDListItem>
                      <div slot='headline'>All Notifications</div>
                      <div slot='supporting-text'>
                        Turn {user?.notificationsEnabled ?? true ? 'off' : 'on'}{' '}
                        notifications on all devices
                      </div>
                      {isLoadingToggleNotifications ? (
                        <MDCircularProgress
                          indeterminate
                          slot='end'
                        />
                      ) : (
                        <MDSwitch
                          slot='end'
                          selected={user?.notificationsEnabled ?? true}
                          onClick={() => {
                            void (async () => {
                              setIsLoadingToggleNotifications(true)
                              await toggleNotifications()
                              setIsLoadingToggleNotifications(false)
                            })()
                          }}
                        />
                      )}
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
