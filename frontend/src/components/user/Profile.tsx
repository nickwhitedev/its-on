import './Profile.css'

import { UserProfile } from '@clerk/clerk-react'
import MDIcon from '../material/MDIcon'
import NotificationSettings from '../notifications/NotificationSettings'
import StripePricingTable from '../stripe/StripePricingTable'

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
        <UserProfile.Page
          label='Upgrade'
          url='/upgrade'
          labelIcon={<MDIcon className='Profile-button-icon'>upgrade</MDIcon>}
        >
          <StripePricingTable />
        </UserProfile.Page>
      </UserProfile>
    </div>
  )
}

export default Profile
