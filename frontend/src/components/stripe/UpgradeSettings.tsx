import './UpgradeSettings.css'

import StripePricingTable from './StripePricingTable'
import { useUser } from '../../contexts/user/userContext'

const UpgradeSettings = () => {
  const user = useUser()
  return (
    <div className='UpgradeSettings'>
      <div className='UpgradeSettings-heading'>
        <div />
        <h1 className='UpgradeSettings-heading-header'>Upgrade</h1>
        <div className='UpgradeSettings-heading-tier'>
          It&apos;s On {user?.tier ?? 5}
        </div>
      </div>
      <StripePricingTable />
      {/* TODO: Add more upgrade settings here
      <MDList className='UpgradeSettings-list'>
        <MDListItem type='link' href=''>
          <div slot='headline'>Account Tier</div>
          <div slot='end'>{user?.tier ?? 5}</div>
        </MDListItem>
      </MDList> */}
    </div>
  )
}

export default UpgradeSettings
