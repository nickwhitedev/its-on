import './UserSettings.css'

import { useCallback, useState } from 'react'
import { useUser, useUserDispatch } from '../../contexts/user/userContext'

import { AuthEventData } from '@aws-amplify/ui'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import { UserDispatchActionType } from '../../contexts/user/userReducer'
import { fetchApi } from '../../utils/api'
import { sendErrorLog } from '../../utils/logging'
import MDDialog from '../material/MDDialog'
import MDIcon from '../material/MDIcon'
import MDSwitch from '../material/MDSwitch'
import MDTextButton from '../material/button/MDTextButton'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDList from '../material/list/MDList'
import MDListItem from '../material/list/MDListItem'

const UserSettings = ({
  className,
  onSignOut,
}: {
  className: string
  onSignOut: ((data?: AuthEventData | undefined) => void) | undefined
}) => {
  const user = useUser()

  const dispatchError = useErrorDispatch()
  const dispatchUser = useUserDispatch()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const notificationsEnabled = user?.notificationsEnabled ?? true

  const handleToggleNotifications = useCallback(async () => {
    dispatchUser({
      type: notificationsEnabled
        ? UserDispatchActionType.NOTIFICATIONS_DISABLED
        : UserDispatchActionType.NOTIFICATIONS_ENABLED,
    })
    try {
      await fetchApi(
        notificationsEnabled
          ? '/disable-notifications'
          : '/enable-notifications',
        'POST',
      )
    } catch (error) {
      dispatchUser({
        type: notificationsEnabled
          ? UserDispatchActionType.NOTIFICATIONS_ENABLED
          : UserDispatchActionType.NOTIFICATIONS_DISABLED,
      })
      await sendErrorLog('UserSettings toggle notifications error', { error })
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
  }, [dispatchError, dispatchUser, notificationsEnabled])

  return (
    <div className={className}>
      <MDIconButton
        onClick={() => {
          setIsDialogOpen(previous => !previous)
        }}
      >
        <MDIcon>settings</MDIcon>
      </MDIconButton>
      <MDDialog
        className='UserSettings-dialog'
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
        }}
      >
        <div slot='headline'>Settings</div>
        <div slot='content'>
          <MDList className='UserSettings-list'>
            <MDListItem>
              <div slot='headline'>Username</div>
              <div slot='end'>{user?.username}</div>
            </MDListItem>
            <MDListItem
              type='button'
              onClick={() => void handleToggleNotifications()}
            >
              <div slot='headline'>Notifications</div>
              <div slot='end'>
                <MDSwitch selected={notificationsEnabled} />
              </div>
              {notificationsEnabled &&
              'Notification' in window &&
              Notification.permission === 'denied' ? (
                <div slot='supporting-text'>
                  Notifications are disabled on this device. Go to device
                  settings.
                </div>
              ) : null}
            </MDListItem>
            <MDListItem
              type='button'
              onClick={onSignOut}
            >
              <div slot='headline'>Logout</div>
            </MDListItem>
          </MDList>
        </div>
        <div slot='actions'>
          <MDTextButton
            onClick={() => {
              setIsDialogOpen(false)
            }}
          >
            Close
          </MDTextButton>
        </div>
      </MDDialog>
    </div>
  )
}

export default UserSettings
