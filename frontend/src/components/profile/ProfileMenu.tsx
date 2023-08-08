import { useCallback } from 'react'
import { fullLogoutUrl, logout } from '../../utils/auth'

const ProfileMenu = () => {
  const handleLogout = useCallback(() => {
    logout()
    window.location.assign(fullLogoutUrl)
  }, [])
  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default ProfileMenu
