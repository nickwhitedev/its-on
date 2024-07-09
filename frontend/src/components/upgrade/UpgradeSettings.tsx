import './UpgradeSettings.css'

import StripePricingTable from './StripePricingTable'
import { useUser } from '../../contexts/user/userContext'
import MDLinearProgress from '../material/progress/MDLinearProgress'
import {
  getUpgradeEventCountGoalForTier,
  getUpgradeMinimumIntervalStringForTier,
  getUpgradeRequiredSubscriberCountForTier,
  getUpgradeStreakWindowStringForTier,
} from '../../utils/upgrade'
import { TIER_100, TIER_5 } from '../../utils/constants'
import MDIcon from '../material/MDIcon'
import ItsOnIcon from '../icons/ItsOnIcon'
import MDFilledButton from '../material/button/MDFilledButton'
import MDElevation from '../material/MDElevation'
import { useFetchApi } from '../../utils/api'
import { useNavigate } from 'react-router-dom'
import { useSendLog } from '../../utils/logging'
import { useErrorDispatch } from '../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../contexts/error/errorReducer'
import MDCircularProgress from '../material/progress/MDCircularProgress'
import { useState } from 'react'
import { UPGRADE_SUCCESS_PATH } from '../../utils/urls'

const UpgradeSettings = () => {
  const fetchApi = useFetchApi()
  const navigate = useNavigate()
  const sendLog = useSendLog()

  const dispatchError = useErrorDispatch()

  const [isUpgrading, setIsUpgrading] = useState<boolean>(false)

  const user = useUser()
  const tier = user?.tier ?? TIER_5
  const streak = (user?.upgradeQualifyingEventTimestamps ?? []).length

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      await fetchApi('/upgrade', 'POST')
      navigate(UPGRADE_SUCCESS_PATH)
    } catch (error) {
      await sendLog('Channel delete error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
    setIsUpgrading(false)
  }

  return (
    <div className='UpgradeSettings'>
      <h3 className='UpgradeSettings-tier-heading'>
        Current Tier:{' '}
        <span className='UpgradeSettings-heading-tier'>
          It&apos;s On {user?.tier ?? 5}
        </span>
      </h3>
      {user?.unlimited !== true && tier < TIER_100 ? (
        <>
          <div className='UpgradeSettings-streak'>
            <MDElevation />
            <div className='UpgradeSettings-streak-info'>
              <h4 className='UpgradeSettings-streak-info-heading'>
                Current Streak:{' '}
                <span className='UpgradeSettings-streak-current'>{streak}</span>
              </h4>
              <MDFilledButton
                className='UpgradeSettings-streak-upgrade-button'
                disabled={user?.eligibleForUpgrade !== true || isUpgrading}
                onClick={() => void handleUpgrade()}
              >
                {isUpgrading ? (
                  <MDCircularProgress
                    className='UpgradeSettings-button-spinner'
                    indeterminate
                  />
                ) : (
                  'Upgrade'
                )}
              </MDFilledButton>
            </div>
            <MDLinearProgress
              className='UpgradeSettings-streak-progress'
              value={streak / getUpgradeEventCountGoalForTier(tier)}
            />
            <p className='UpgradeSettings-streak-instructions'>
              To permanently unlock the next tier, press the{' '}
              <MDIcon className='UpgradeSettings-streak-instructions-icon'>
                <ItsOnIcon />
              </MDIcon>{' '}
              button for any channel with at least{' '}
              {getUpgradeRequiredSubscriberCountForTier(tier)} subscribers{' '}
              {getUpgradeEventCountGoalForTier(tier)} times in{' '}
              {getUpgradeStreakWindowStringForTier(tier)}
            </p>
            <p className='UpgradeSettings-streak-instructions-disclaimer'>
              Only 1 event counts per{' '}
              {getUpgradeMinimumIntervalStringForTier(tier)}
            </p>
          </div>
        </>
      ) : null}
      <div className='UpgradeSettings-pricing-table'>
        <StripePricingTable />
      </div>
    </div>
  )
}

export default UpgradeSettings
