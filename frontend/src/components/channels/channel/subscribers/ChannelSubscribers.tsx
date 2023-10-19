import './ChannelSubscribers.css'

import React, { useState } from 'react'
import { useChannelsDispatch } from '../../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../../contexts/channels/channelsReducer'
import { useUser } from '../../../../contexts/user/userContext'
import { fetchApi } from '../../../../utils/api'
import MDDivider from '../../../material/MDDivider'
import MDList from '../../../material/list/MDList'
import MDListItem from '../../../material/list/MDListItem'
import MDOutlinedTextField from '../../../material/text-field/MDOutlinedTextField'
import { DEFAULT_USER_TIER } from '../channelUtils'
import ChannelSubscriber from './ChannelSubscriber'

interface Props {
  channel: IChannel
  isEditing: boolean
  setIsLoading: (newValue: boolean) => void
}

const ChannelSubscribers = ({ channel, isEditing, setIsLoading }: Props) => {
  const user = useUser()
  const dispatchChannels = useChannelsDispatch()

  const [newCapacity, setNewCapacity] = useState<string>(
    `${channel.capacity ?? 5}`,
  )

  const subscriberCount = channel.subscriberCount ?? 0
  const userTier = user?.tier ?? DEFAULT_USER_TIER

  const handleChangeCapacity = async () => {
    const targetCapacity = Number(newCapacity)

    if (
      isNaN(targetCapacity) ||
      targetCapacity > userTier ||
      targetCapacity === channel.capacity
    )
      return
    setIsLoading(true)

    try {
      const channelUpdates = {
        capacity: targetCapacity,
        duration: channel.duration,
        note: channel.note,
        title: channel.title,
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
      // TODO: Handle update channel error
      // log error to backend
      // display user friendly message
    }

    setIsLoading(false)
  }

  return (
    <div className='ChannelSubscribers'>
      <MDList className='ChannelSubscribers-list'>
        <MDListItem>
          <div slot='headline'>Subscribers</div>
          <div slot='trailing-supporting-text'>
            {subscriberCount}
            {channel.capacity == null ? null : (
              <>
                {' '}
                /{' '}
                {isEditing ? (
                  <MDOutlinedTextField
                    className={'ChannelSubscribers-capacity-input'}
                    error={Number(newCapacity) > 5}
                    max={`${userTier}`}
                    min={`${subscriberCount}`}
                    step='1'
                    type='number'
                    value={newCapacity}
                    onInput={event => {
                      setNewCapacity(
                        `${Math.floor(
                          Number(
                            (event.target as EventTarget & HTMLSelectElement)
                              .value,
                          ),
                        )}`,
                      )
                    }}
                    onChange={() => void handleChangeCapacity()}
                  />
                ) : (
                  channel.capacity
                )}
              </>
            )}
          </div>
        </MDListItem>
        {channel.subscribers?.map(subscriber => (
          <React.Fragment key={subscriber.id}>
            <MDDivider inset />
            <MDListItem className='ChannelSubscriber-list-item'>
              <ChannelSubscriber
                channel={channel}
                subscriber={subscriber}
                setIsLoading={setIsLoading}
              />
            </MDListItem>
          </React.Fragment>
        )) ?? (
          <>
            <MDDivider inset />
            <MDListItem>
              Share your channel to let people know it&apos;s on!
            </MDListItem>
          </>
        )}
      </MDList>
    </div>
  )
}

export default ChannelSubscribers
