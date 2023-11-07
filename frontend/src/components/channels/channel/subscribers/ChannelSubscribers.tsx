import './ChannelSubscribers.css'

import React, { useState } from 'react'
import { useUser } from '../../../../contexts/user/userContext'
import MDDivider from '../../../material/MDDivider'
import MDList from '../../../material/list/MDList'
import MDListItem from '../../../material/list/MDListItem'
import MDOutlinedTextField from '../../../material/text-field/MDOutlinedTextField'
import { DEFAULT_USER_TIER } from '../channelUtils'
import ChannelSubscriber from './ChannelSubscriber'

interface Props {
  capacity: number
  channel: IChannel
  isEditing: boolean
  isLoading: boolean
  onChangeCapacity: (value: number) => void
  setIsLoading: (newValue: boolean) => void
}

const ChannelSubscribers = ({
  capacity,
  channel,
  isEditing,
  isLoading,
  onChangeCapacity,
  setIsLoading,
}: Props) => {
  const user = useUser()

  const subscriberCount = channel.subscriberCount ?? 0
  const userTier = user?.tier ?? DEFAULT_USER_TIER

  const [newCapacity, setNewCapacity] = useState<string>(
    `${channel.capacity ?? userTier}`,
  )

  const handleChangeCapacity = () => {
    const targetCapacity = Number(newCapacity)

    if (
      isNaN(targetCapacity) ||
      targetCapacity > userTier ||
      targetCapacity === capacity
    )
      return

    onChangeCapacity(targetCapacity)
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
                    disabled={isLoading}
                    error={Number(newCapacity) > userTier}
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
                    onChange={handleChangeCapacity}
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
