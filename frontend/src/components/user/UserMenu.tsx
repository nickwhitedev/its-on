import './UserMenu.css'

import { useClerk, useUser as useClerkUser } from '@clerk/clerk-react'
import MDIcon from '../material/MDIcon'
import MDIconButton from '../material/icon-button/MDIconButton'
import { useEffect, useRef, useState } from 'react'
import { MdMenu } from '@material/web/menu/menu'
import { MdIconButton } from '@material/web/iconbutton/icon-button'
import MDMenu from '../material/menu/MDMenu'
import MDMenuItem from '../material/menu/MDMenuItem'
import { Link, useNavigate } from 'react-router-dom'
import MDListItem from '../material/list/MDListItem'
import {
  PRIVACY_PATH,
  PROFILE_PATH,
  SUPPORT_PATH,
  TERMS_PATH,
  UPGRADE_PATH,
} from '../../utils/urls'
import { useDisableDeviceNotifications } from '../../utils/notifications'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { useSendLog } from '../../utils/logging'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'

const UserMenu = () => {
  const { isLoaded, user: clerkUser } = useClerkUser()
  const { signOut } = useClerk()

  const dispatchError = useErrorDispatch()
  const disableDeviceNotifications = useDisableDeviceNotifications()
  const navigate = useNavigate()
  const sendLog = useSendLog()

  const menuAnchorRef = useRef<MdIconButton | null>(null)
  const menuRef = useRef<MdMenu | null>(null)

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  useEffect(() => {
    const setMenuClosed = () => {
      setIsMenuOpen(false)
    }

    addEventListener('scroll', setMenuClosed)
    return () => {
      removeEventListener('scroll', setMenuClosed)
    }
  }, [])

  useEffect(() => {
    if (menuAnchorRef.current != null && menuRef.current != null) {
      menuRef.current.anchorElement = menuAnchorRef.current
    }
  }, [menuAnchorRef, menuRef])

  const handleSignOut = async () => {
    try {
      await disableDeviceNotifications()
      await signOut()
      navigate('/')
    } catch (error) {
      await sendLog('Error signing user out', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
  }

  if (!isLoaded) return null
  if (clerkUser == null) return null
  return (
    <>
      <MDIconButton
        className='UserMenu-button'
        aria-label='Profile'
        ref={menuAnchorRef}
        onClick={() => {
          setIsMenuOpen(previousIsMenuOpen => !previousIsMenuOpen)
        }}
      >
        <MDIcon className='UserMenu-profile-pic'>
          <img src={clerkUser.imageUrl} />
        </MDIcon>
      </MDIconButton>
      <MDMenu
        className='UserMenu-menu'
        open={isMenuOpen}
        positioning='fixed'
        ref={menuRef}
        onClosed={() => {
          setIsMenuOpen(false)
        }}
      >
        <MDListItem className='UserMenu-menu-item' type='text'>
          <MDIcon slot='start' className='UserMenu-profile-pic'>
            <img src={clerkUser.imageUrl} />
          </MDIcon>
          <div className='UserMenu-menu-text' slot='headline'>
            {clerkUser.username}
          </div>
        </MDListItem>
        <MDMenuItem
          className='UserMenu-menu-item'
          type='link'
          href={`/${PROFILE_PATH}`}
        >
          <MDIcon className='UserMenu-menu-item-icon' slot='start'>
            settings
          </MDIcon>
          <div className='UserMenu-menu-text' slot='headline'>
            Manage Account
          </div>
        </MDMenuItem>
        <MDMenuItem
          className='UserMenu-menu-item'
          type='link'
          href={`/${UPGRADE_PATH}`}
        >
          <MDIcon className='UserMenu-menu-item-icon' slot='start'>
            upgrade
          </MDIcon>
          <div className='UserMenu-menu-text' slot='headline'>
            Upgrade
          </div>
        </MDMenuItem>
        <MDMenuItem
          className='UserMenu-menu-item'
          type='button'
          onClick={() => void handleSignOut()}
        >
          <MDIcon className='UserMenu-menu-item-icon' slot='start'>
            logout
          </MDIcon>
          <div className='UserMenu-menu-text' slot='headline'>
            Sign Out
          </div>
        </MDMenuItem>
        <div className='UserMenu-footer'>
          <Link
            to={`/${SUPPORT_PATH}`}
            onClick={() => {
              setIsMenuOpen(false)
            }}
          >
            Help
          </Link>
          <Link
            to={`/${PRIVACY_PATH}`}
            onClick={() => {
              setIsMenuOpen(false)
            }}
          >
            Privacy
          </Link>
          <Link
            to={`/${TERMS_PATH}`}
            onClick={() => {
              setIsMenuOpen(false)
            }}
          >
            Terms
          </Link>
        </div>
      </MDMenu>
    </>
  )
}

export default UserMenu
