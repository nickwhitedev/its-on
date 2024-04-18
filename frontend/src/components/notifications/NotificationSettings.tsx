import './NotificationSettings.css'

import { useState } from 'react'
import {
  useGetIsNotificationPermissionRequestable,
  useGetNotificationPermission,
  useRequestNotificationPermissions,
  useToggleNotifications,
} from '../../utils/notifications'
import MDFilledButton from '../material/button/MDFilledButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'
import MDSwitch from '../material/MDSwitch'
import MDCircularProgress from '../material/progress/MDCircularProgress'
import { useUser } from '../../contexts/user/userContext'

const NotificationSettings = () => {
  const user = useUser()

  const requestNotificationPermissions = useRequestNotificationPermissions()
  const toggleNotifications = useToggleNotifications()
  const getNotificationPermission = useGetNotificationPermission()
  const getIsNotificationPermissionRequestable =
    useGetIsNotificationPermissionRequestable()

  const [deviceNotificationPermission, setDeviceNotificationPermission] =
    useState<string>(getNotificationPermission())

  const [
    deviceNotificationPermissionsRequested,
    setDeviceNotificationPermissionsRequested,
  ] = useState<boolean>(false)

  const [isLoadingToggleNotifications, setIsLoadingToggleNotifications] =
    useState<boolean>(false)

  return (
    <div>
      <h1 className='NotificationSettings-heading'>Notifications</h1>
      <MDList className='NotificationSettings-list'>
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
                savedNotificationTokens: user?.notificationTokens ?? {},
                onPermissionSubmitted: (isPermissionGranted: boolean) => {
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
            <MDCircularProgress indeterminate slot='end' />
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
  )
}

export default NotificationSettings
