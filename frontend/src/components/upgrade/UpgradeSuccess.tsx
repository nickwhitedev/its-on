import './UpgradeSuccess.css'

import { useCallback, useState } from 'react'
import { useUser } from '../../contexts/user/userContext'
import { useSyncOverview } from '../../utils/requests/syncOverview'
import MDIconButton from '../material/icon-button/MDIconButton'
import MDCircularProgress from '../material/progress/MDCircularProgress'
import MDIcon from '../material/MDIcon'

const UpgradeSuccess = () => {
  const user = useUser()
  const syncOverviewRequest = useSyncOverview()

  const [isLoading, setIsLoading] = useState(false)

  const syncOverview = useCallback(async () => {
    setIsLoading(true)
    await syncOverviewRequest()
    setIsLoading(false)
  }, [syncOverviewRequest])

  return (
    <div>
      <h2>Account Upgraded!</h2>
      <p className='UpgradeSuccess-current-tier'>
        <div />
        Your current tier is {user?.tier ?? 5}
        {isLoading ? (
          <MDCircularProgress
            className='UpgradeSuccess-refresh-spinner'
            indeterminate={true}
          />
        ) : (
          <MDIconButton
            className='UpgradeSuccess-refresh-button'
            onClick={() => void syncOverview()}
          >
            <MDIcon>refresh</MDIcon>
          </MDIconButton>
        )}
      </p>
      <p>Now you&apos;re ready to take your channels to the next level!</p>
    </div>
  )
}

export default UpgradeSuccess
