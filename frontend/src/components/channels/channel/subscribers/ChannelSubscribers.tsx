import './ChannelSubscribers.css'

import React from 'react'

import MDDivider from '../../../material/MDDivider'
import MDList from '../../../material/list/MDList'
import MDListItem from '../../../material/list/MDListItem'
import MDCircularProgress from '../../../material/progress/MDCircularProgress'
import ShareChannelButton from '../ShareChannelButton'
import ChannelSubscriber from './ChannelSubscriber'

interface Props {
  channel: IChannel
  isLoading: boolean
  isUpdating: boolean
  setIsUpdating: (newValue: boolean) => void
}

const ChannelSubscribers = ({
  channel,
  isLoading,
  isUpdating,
  setIsUpdating,
}: Props) => {
  const subscriberCount = channel.subscriberCount ?? 0

  return (
    <div className='ChannelSubscribers'>
      <MDList className='ChannelSubscribers-list'>
        <MDListItem>
          <div slot='headline'>Subscribers</div>
          <div slot='trailing-supporting-text'>
            {subscriberCount}
            {channel.capacity == null ? null : <> / {channel.capacity}</>}
          </div>
        </MDListItem>
        {isLoading ? (
          <>
            <MDDivider inset />
            <MDListItem className='ChannelSubscribers-spinner-container'>
              <MDCircularProgress indeterminate />
            </MDListItem>
          </>
        ) : (channel.subscribers?.length ?? 0) > 0 ? (
          channel.subscribers?.map(subscriber => (
            <React.Fragment key={subscriber.id}>
              <MDDivider inset />
              <MDListItem className='ChannelSubscriber-list-item'>
                <ChannelSubscriber
                  channel={channel}
                  subscriber={subscriber}
                  setIsUpdating={setIsUpdating}
                />
              </MDListItem>
            </React.Fragment>
          ))
        ) : (
          <>
            <MDDivider inset />
            <MDListItem>
              Share your channel to let people know when it&apos;s on!
            </MDListItem>
            <MDListItem>
              <ShareChannelButton
                channel={channel}
                isUpdating={isUpdating}
                size='large'
              />
            </MDListItem>
          </>
        )}
      </MDList>
    </div>
  )
}

export default ChannelSubscribers
