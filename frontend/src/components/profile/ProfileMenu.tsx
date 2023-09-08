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
    <div className='ProfileMenu'>
      <a
        className='icon'
        href='#'
        onClick={event => {
          event.preventDefault()
          navigate(-1)
        }}
      >
        <span className='material-symbols-outlined'>arrow_back</span>
      </a>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default ProfileMenu
