import './ShareChannelButton.css'

import { useState } from 'react'
import { baseUrl } from '../../../utils/urls'
import MDIcon from '../../material/MDIcon'
import MDFilledButton from '../../material/button/MDFilledButton'
import MDIconButton from '../../material/icon-button/MDIconButton'
import { channelDisplayTitle } from './channelUtils'

interface Props {
  channel: IChannel
  isUpdating: boolean
  size: 'small' | 'large'
}

const ShareChannelButton = ({ channel, isUpdating, size }: Props) => {
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const displayTitle = channelDisplayTitle(channel)

  const handleClickShareChannel = async () => {
    const channelURL = `${baseUrl}/${channel.id}`
    try {
      await navigator.share({
        title: `It's On - ${displayTitle}`,
        text: `Check out the channel, ${displayTitle}, by ${channel.owner}`,
        url: channelURL,
      })
    } catch (error) {
      await navigator.clipboard.writeText(channelURL)
      setChannelCopied(true)
    }
  }

  return (
    <div className='ShareChannelButton'>
      {size === 'small' ? (
        <MDIconButton
          aria-label='Share'
          disabled={isUpdating}
          onClick={() => void handleClickShareChannel()}
          onBlur={() => {
            setChannelCopied(false)
          }}
        >
          <MDIcon>share</MDIcon>
        </MDIconButton>
      ) : (
        <MDFilledButton
          aria-label='Share'
          disabled={isUpdating}
          onClick={() => void handleClickShareChannel()}
          onBlur={() => {
            setChannelCopied(false)
          }}
        >
          Share Channel
          <MDIcon slot='icon'>share</MDIcon>
        </MDFilledButton>
      )}
      <span
        className={`ShareChannelButton-copied secondary-text ${
          channelCopied ? '' : 'hidden'
        }`}
      >
        Copied!
      </span>
    </div>
  )
}

export default ShareChannelButton
