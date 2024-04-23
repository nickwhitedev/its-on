import './DeleteChannelButton.css'

import { useState } from 'react'
import MDTextButton from '../../material/button/MDTextButton'
import MDIcon from '../../material/MDIcon'
import MDDialog from '../../material/MDDialog'
import { useFetchApi } from '../../../utils/api'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { useUserDispatch } from '../../../contexts/user/userContext'
import { UserDispatchActionType } from '../../../contexts/user/userReducer'
import { useNavigate } from 'react-router-dom'
import { useSendLog } from '../../../utils/logging'
import { useErrorDispatch } from '../../../contexts/error/errorContext'
import { ErrorDispatchActionType } from '../../../contexts/error/errorReducer'

interface Props {
  channel: IChannel
  isUpdating: boolean
  setIsUpdating: (nextIsUpdating: boolean) => void
}

const DeleteChannelButton = ({ channel, isUpdating, setIsUpdating }: Props) => {
  const fetchApi = useFetchApi()
  const navigate = useNavigate()
  const sendLog = useSendLog()

  const dispatchChannels = useChannelsDispatch()
  const dispatchUser = useUserDispatch()
  const dispatchError = useErrorDispatch()

  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false)

  const handleConfirmDelete = async () => {
    setIsUpdating(true)
    try {
      await fetchApi(`/${channel.id}`, 'DELETE')
      dispatchChannels({
        type: ChannelsDispatchActionType.DELETED,
        id: channel.id,
      })
      dispatchUser({
        type: UserDispatchActionType.CHANNEL_COUNT_DECREASED,
      })
      navigate('/channels')
    } catch (error) {
      await sendLog('Channel delete error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }
    setIsConfirmingDelete(false)
    setIsUpdating(false)
  }

  return (
    <div className='DeleteChannelButton'>
      <MDTextButton
        aria-label='Delete channel'
        className='DeleteChannelButton-button'
        disabled={isUpdating}
        hasIcon
        onClick={() => {
          setIsConfirmingDelete(true)
        }}
      >
        <MDIcon slot='icon'>delete</MDIcon> Delete
      </MDTextButton>
      <MDDialog open={isConfirmingDelete}>
        <div slot='headline'>Delete Channel</div>
        <div
          className='DeleteChannelButton-confirmation-content'
          slot='content'
        >
          This channel
          {channel.title === '' || channel.title == null
            ? ' '
            : `, ${channel.title}, `}
          will be deleted forever. Are you sure?
        </div>
        <div slot='actions'>
          <MDTextButton
            disabled={isUpdating}
            onClick={() => {
              setIsConfirmingDelete(false)
            }}
          >
            Cancel
          </MDTextButton>
          <MDTextButton
            className='DeleteChannelButton-button'
            disabled={isUpdating}
            onClick={() => void handleConfirmDelete()}
          >
            Delete
          </MDTextButton>
        </div>
      </MDDialog>
    </div>
  )
}

export default DeleteChannelButton
