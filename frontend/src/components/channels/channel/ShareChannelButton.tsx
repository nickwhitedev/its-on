import './ShareChannelButton.css'

import MDFilledButton from '../../material/button/MDFilledButton'
import MDIcon from '../../material/MDIcon'
import MDIconButton from '../../material/icon-button/MDIconButton'
import { BASE_URL } from '../../../utils/urls'
import { channelDisplayTitle } from './channelUtils'
import { useState } from 'react'

interface Props {
  channel: IChannel
  isUpdating: boolean
  size: 'small' | 'large'
}

const ShareChannelButton = ({ channel, isUpdating, size }: Props) => {
  const [channelCopied, setChannelCopied] = useState<boolean>(false)

  const displayTitle = channelDisplayTitle(channel)

  const handleClickShareChannel = async () => {
    const channelURL = `${BASE_URL}/${channel.id}`
    try {
      await navigator.share({
        title: `It's On - ${displayTitle}`,
        text: `Check out the channel, ${displayTitle}, by ${
          channel.owner ?? 'Unknown'
        }`,
        url: channelURL,
      })
    } catch {
      await navigator.clipboard.writeText(channelURL)
      setChannelCopied(true)
    }
  }

  return (
    <div className={`ShareChannelButton ${size === 'large' ? 'large' : ''}`}>
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
      <div
        className={`ShareChannelButton-copied secondary-text ${
          channelCopied ? '' : 'hidden'
        }`}
      >
        Copied!
      </div>
    </div>
  )
}

export default ShareChannelButton
