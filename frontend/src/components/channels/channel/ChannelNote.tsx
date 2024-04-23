import './ChannelNote.css'

interface Props {
  channel: IChannel
}

const ChannelNote = ({ channel }: Props) => {
  return (channel.note?.length ?? 0) > 0 ? (
    <div className='ChannelNote'>
      <div />
      <span className='ChannelNote-note'>{channel.note}</span>
    </div>
  ) : null
}

export default ChannelNote
