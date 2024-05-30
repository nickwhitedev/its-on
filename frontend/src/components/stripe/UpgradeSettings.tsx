import './UpgradeSettings.css'

import StripePricingTable from './StripePricingTable'
import { useUser } from '../../contexts/user/userContext'

const UpgradeSettings = () => {
  const user = useUser()
  return (
    <div className='UpgradeSettings'>
      <h2 className='UpgradeSettings-heading'>Upgrade</h2>
      <div className='UpgradeSettings-tier-section'>
        Current Tier:{' '}
        <span className='UpgradeSettings-heading-tier'>
          It&apos;s On {user?.tier ?? 5}
        </span>
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
