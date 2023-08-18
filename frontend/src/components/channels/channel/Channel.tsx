import { useChannelsDispatch } from '../../../contexts/channels/channelsContext'
import { ChannelsDispatchActionType } from '../../../contexts/channels/channelsReducer'
import { fetchApi } from '../../../utils/api'

interface Props {
  channel: IChannel
}

const Channel = ({ channel }: Props) => {
  const dispatch = useChannelsDispatch()

  const handleClickItsOn = async () => {
    try {
      const newChannel: IChannel = await fetchApi(
        `/channels/${channel.id}`,
        'PUT',
        {
          compositeID: channel.compositeID,
          defaultNote: channel.defaultNote,
          id: channel.id,
          note: channel.note,
          on: !channel.on,
          title: channel.title,
        },
      )
      dispatch({
        type: ChannelsDispatchActionType.CHANGED,
        channel: newChannel,
      })
    } catch (error) {
      // TODO: Handle create channel error
      // log error to backend
      // display user friendly message
    }
  }

  return (
    <div>
      <button onClick={() => void handleClickItsOn()}>
        Activate/Deactivate
      </button>
      <h2>{channel.title}</h2>
      {channel.on ? <p>It&apos;s On!</p> : null}
      <p>{channel.note || channel.defaultNote}</p>
    </div>
  )
}

export default Channel
