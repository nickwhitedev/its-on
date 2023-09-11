import './ProfileMenu.css'

import { fullLogoutUrl, logout } from '../../utils/auth'

import { Link } from 'react-router-dom'
import { useCallback } from 'react'

const ProfileMenu = () => {
  const handleLogout = useCallback(() => {
    logout()
    window.location.assign(fullLogoutUrl)
  }, [])
  return (
    <div className="ProfileMenu">
      <Link
        to={'/'}
        className="icon"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </Link>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default ProfileMenu
