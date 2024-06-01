import './EditChannel.css'

import { DEFAULT_USER_TIER, durationOptions } from './channelUtils'

import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import DeleteChannelButton from './DeleteChannelButton'
import { ErrorDispatchActionType } from '../../../contexts/error/errorReducer'
import MDIcon from '../../material/MDIcon'
import MDOutlinedButton from '../../material/button/MDOutlinedButton'
import MDOutlinedSelect from '../../material/select/MDOutlinedSelect'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'
import MDSelectOption from '../../material/select/MDSelectOption'
import { MS_IN_HOUR } from '../../../utils/time'
import { Tooltip } from 'react-tooltip'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { useErrorDispatch } from '../../../contexts/error/errorContext'
import { useFetchApi } from '../../../utils/api'
import { useSendLog } from '../../../utils/logging'
import { useState } from 'react'
import { useUser } from '../../../contexts/user/userContext'

interface Props {
  channel: IChannel
  isLoading: boolean
  onClose: () => void
}

const EditChannel = ({ channel, isLoading, onClose }: Props) => {
  const fetchApi = useFetchApi()
  const sendLog = useSendLog()

  const user = useUser()

  const dispatchChannels = useChannelsDispatch()
  const dispatchError = useErrorDispatch()

  const subscriberCount = channel.subscriberCount ?? 0
  const userTier = user?.tier ?? DEFAULT_USER_TIER

  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [currentTitle, setCurrentTitle] = useState<string>(channel.title ?? '')
  const [currentCapacity, setCurrentCapacity] = useState<number>(
    user?.tier ?? DEFAULT_USER_TIER,
  )
  const [currentDuration, setCurrentDuration] = useState<number>(
    channel.duration ?? MS_IN_HOUR,
  )
  const [currentNote, setCurrentNote] = useState<string>(channel.note ?? '')

  const [newCapacity, setNewCapacity] = useState<number>(
    channel.capacity ?? userTier,
  )

  const handleChangeCapacity = () => {
    if (
      isNaN(newCapacity) ||
      newCapacity > userTier ||
      newCapacity === currentCapacity
    )
      return

    setCurrentCapacity(newCapacity)
  }

  const saveUpdates = async () => {
    setIsUpdating(true)

    try {
      const channelUpdates = {
        capacity: currentCapacity,
        duration: currentDuration,
        note: currentNote,
        title: currentTitle,
      }
      await fetchApi(`/${channel.id}`, 'PUT', channelUpdates)
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          ...channelUpdates,
        },
      })
    } catch (error) {
      await sendLog('Channel update error', { error }, 'ERROR')
      dispatchError({
        type: ErrorDispatchActionType.ERROR_SNACKBAR_TRIGGERED,
      })
    }

    setIsUpdating(false)
    onClose()
  }

  return (
    <div className='EditChannel'>
      <MDOutlinedTextField
        className={'EditChannel-header-title-input'}
        disabled={isLoading || isUpdating}
        label='Title'
        maxLength={40}
        rows={1}
        type='textarea'
        value={currentTitle}
        onInput={(event: Event) => {
          setCurrentTitle((event.target as unknown as { value: string }).value)
        }}
      />

      <div className='EditChannel-options'>
        <MDOutlinedTextField
          className={'EditChannel-capacity-input'}
          disabled={isUpdating}
          error={newCapacity > userTier}
          label='Channel Size'
          max={userTier.toString()}
          min={subscriberCount.toString()}
          step='1'
          supportingText='Subscriber limit'
          type='number'
          value={newCapacity.toString()}
          onInput={event => {
            setNewCapacity(
              Math.floor(
                Number((event.target as EventTarget & HTMLSelectElement).value),
              ),
            )
          }}
          onChange={handleChangeCapacity}
        >
          <a
            className='EditChannel-capacity-info-anchor'
            slot='trailing-icon'
            data-tooltip-id='EditChannel-capacity-tooltip'
            data-tooltip-content={`Upgrade to increase past ${userTier.toLocaleString()}`}
          >
            <MDIcon className='EditChannel-capacity-info-icon'>info</MDIcon>
          </a>
        </MDOutlinedTextField>
        <Tooltip id='EditChannel-capacity-tooltip' />

        <MDOutlinedSelect
          className='EditChannel-duration-select'
          disabled={isUpdating || isLoading}
          label='Channel Duration'
          supportingText='How long it stays on'
          value={currentDuration.toString()}
          onChange={(event: Event) => {
            const newDuration = Number(
              (event.target as EventTarget & HTMLSelectElement).value,
            )
            if (isNaN(newDuration)) return
            setCurrentDuration(newDuration)
          }}
        >
          {durationOptions.map(durationOption => (
            <MDSelectOption
              disabled={isUpdating}
              key={durationOption.value}
              selected={durationOption.value === currentDuration}
              value={durationOption.value.toString()}
            >
              <div slot='headline'>{durationOption.displayName}</div>
            </MDSelectOption>
          ))}
        </MDOutlinedSelect>
      </div>

      <MDOutlinedTextField
        className={'EditChannel-note-input'}
        disabled={isLoading || isUpdating}
        label='Note'
        maxLength={200}
        placeholder="Let's meet at my place"
        rows={4}
        supportingText='Leave a note or instructions for your subscribers'
        type='textarea'
        value={currentNote}
        onInput={(event: Event) => {
          setCurrentNote((event.target as unknown as { value: string }).value)
        }}
      />

      <div className='EditChannel-save-section'>
        <MDOutlinedButton
          className='EditChannel-button-close'
          disabled={!channel.title || isUpdating}
          onClick={onClose}
        >
          <MDIcon slot='icon'>close</MDIcon> Cancel
        </MDOutlinedButton>
        <MDOutlinedButton
          className='EditChannel-button-save'
          disabled={currentTitle === '' || isUpdating}
          onClick={() => void saveUpdates()}
        >
          <MDIcon slot='icon'>done</MDIcon> Save
        </MDOutlinedButton>
      </div>
      <DeleteChannelButton
        channel={channel}
        isUpdating={isUpdating}
        setIsUpdating={setIsUpdating}
      />
    </div>
  )
}

export default EditChannel
