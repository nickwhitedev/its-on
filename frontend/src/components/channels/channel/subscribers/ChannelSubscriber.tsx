import './ChannelSubscriber.css'

import { MdIconButton } from '@material/web/iconbutton/icon-button'
import { MdMenu } from '@material/web/menu/menu'
import { useEffect, useRef, useState } from 'react'
import { useChannelsDispatch } from '../../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../../utils/api'
import MDIcon from '../../../material/MDIcon'
import MDIconButton from '../../../material/icon-button/MDIconButton'
import MDMenu from '../../../material/menu/MDMenu'
import MDMenuItem from '../../../material/menu/MDMenuItem'

interface Props {
  channel: IChannel
  subscriber: IChannelSubscriber
  setIsLoading: (newValue: boolean) => void
}

const ChannelSubscriber = ({ channel, subscriber, setIsLoading }: Props) => {
  const dispatchChannels = useChannelsDispatch()

  const menuAnchorRef = useRef<MdIconButton | null>(null)
  const menuRef = useRef<MdMenu | null>(null)

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  useEffect(() => {
    const setMenuClosed = () => {
      setIsMenuOpen(false)
    }

    addEventListener('scroll', setMenuClosed)
    return () => {
      removeEventListener('scroll', setMenuClosed)
    }
  }, [])

  useEffect(() => {
    if (menuAnchorRef.current != null && menuRef.current != null) {
      menuRef.current.anchorElement = menuAnchorRef.current
    }
  }, [menuAnchorRef, menuRef])

  const handleClickRemove = async () => {
    setIsLoading(true)
    setIsMenuOpen(false)
    try {
      await fetchApi(`/${channel.id}/subscribers/${subscriber.id}`, 'DELETE')
      dispatchChannels({
        type: ChannelsDispatchActionType.CHANGED,
        channel: {
          ...channel,
          subscribers: channel.subscribers?.filter(
            (channelSubscriber: IChannelSubscriber) =>
              channelSubscriber.id !== subscriber.id,
          ),
          subscriberCount: (channel.subscriberCount ?? 1) - 1,
        },
      })
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
    // setIsConfirmingRemove(false)
    setIsLoading(false)
  }

  return (
    <>
      <div slot='supporting-text'>{subscriber.username}</div>
      <MDIconButton
        aria-label='More'
        slot='end'
        ref={menuAnchorRef}
        onClick={() => {
          setIsMenuOpen(previousIsMenuOpen => !previousIsMenuOpen)
        }}
      >
        <MDIcon>more_horiz</MDIcon>
      </MDIconButton>
      <MDMenu
        open={isMenuOpen}
        positioning='fixed'
        ref={menuRef}
        onClosed={() => {
          setIsMenuOpen(false)
        }}
      >
        <MDMenuItem
          type='button'
          onClick={() => void handleClickRemove()}
        >
          Remove
        </MDMenuItem>
      </MDMenu>
    </>
  )
}

export default ChannelSubscriber
