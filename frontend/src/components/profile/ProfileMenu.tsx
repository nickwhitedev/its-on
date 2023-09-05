import './ProfileMenu.css'

import { fullLogoutUrl, logout } from '../../utils/auth'

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const ProfileMenu = () => {
  const navigate = useNavigate()
  const handleLogout = useCallback(() => {
    logout()
    window.location.assign(fullLogoutUrl)
  }, [])
  return (
    <div className="ProfileMenu">
      <button
        onClick={() => {
          navigate(-1)
        }}
      >
        Back
      </button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default ProfileMenu
