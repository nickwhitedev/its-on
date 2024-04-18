import './Profile.css'

import { UserProfile } from '@clerk/clerk-react'
import MDIcon from '../material/MDIcon'
import NotificationSettings from '../notifications/NotificationSettings'

const Profile = () => {
  return (
    <div className='Profile'>
      <UserProfile>
        <UserProfile.Page
          label='Notifications'
          url='/notification-settings'
          labelIcon={
            <MDIcon className='Profile-button-icon'>notifications</MDIcon>
          }
        >
          <NotificationSettings />
        </UserProfile.Page>
      </UserProfile>
    </div>
  )
}

export default Profile
