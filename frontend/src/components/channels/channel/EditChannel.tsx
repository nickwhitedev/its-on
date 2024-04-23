import './EditChannel.css'

import { useState } from 'react'
import MDOutlinedSelect from '../../material/select/MDOutlinedSelect'
import MDIconButton from '../../material/icon-button/MDIconButton'
import MDIcon from '../../material/MDIcon'
import MDOutlinedTextField from '../../material/text-field/MDOutlinedTextField'
import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { useFetchApi } from '../../../utils/api'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { useErrorDispatch } from '../../../contexts/error/errorContext'
import { useSendLog } from '../../../utils/logging'
import { ErrorDispatchActionType } from '../../../contexts/error/errorReducer'
import MDSelectOption from '../../material/select/MDSelectOption'
import { MS_IN_HOUR } from '../../../utils/time'
import { DEFAULT_USER_TIER, durationOptions } from './channelUtils'
import MDOutlinedButton from '../../material/button/MDOutlinedButton'
import { useUser } from '../../../contexts/user/userContext'
import { Tooltip } from 'react-tooltip'

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

  const [newCapacity, setNewCapacity] = useState<string>(
    `${channel.capacity ?? userTier}`,
  )

  const handleChangeCapacity = () => {
    const targetCapacity = Number(newCapacity)

    if (
      isNaN(targetCapacity) ||
      targetCapacity > userTier ||
      targetCapacity === currentCapacity
    )
      return

    setCurrentCapacity(targetCapacity)
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
      <div className='EditChannel-header'>
        <MDIconButton
          className='EditChannel-header-button-close'
          disabled={!channel.title || isUpdating}
          onClick={onClose}
        >
          <MDIcon>close</MDIcon>
        </MDIconButton>
        <MDOutlinedTextField
          className={'EditChannel-header-title-input'}
          disabled={isLoading || isUpdating}
          label='Title'
          maxLength={40}
          rows={1}
          type='textarea'
          value={currentTitle}
          onInput={(event: Event) => {
            setCurrentTitle(
              (event.target as unknown as { value: string }).value,
            )
          }}
        />
        <div className='EditChannel-header-save-wrapper'>
          <MDIconButton
            className='EditChannel-header-button-save'
            disabled={currentTitle === '' || isUpdating}
            onClick={() => void saveUpdates()}
          >
            <MDIcon>done</MDIcon>
          </MDIconButton>
        </div>
      </div>

      <div className='EditChannel-options'>
        <MDOutlinedTextField
          className={'EditChannel-capacity-input'}
          disabled={isUpdating}
          error={Number(newCapacity) > userTier}
          label='Channel Size'
          max={`${userTier}`}
          min={`${subscriberCount}`}
          step='1'
          supportingText='Subscriber limit'
          type='number'
          value={newCapacity}
          onInput={event => {
            setNewCapacity(
              `${Math.floor(
                Number((event.target as EventTarget & HTMLSelectElement).value),
              )}`,
            )
          }}
          onChange={handleChangeCapacity}
        >
          <a
            slot='leading-icon'
            data-tooltip-id='EditChannel-capacity-tooltip'
            // TODO: Monetization: Remove Coming Soon language
            data-tooltip-content={`Coming Soon: Upgrade to increase past ${userTier}`}
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
          value={`${currentDuration}`}
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
              value={`${durationOption.value}`}
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
    </div>
  )
}

export default EditChannel
