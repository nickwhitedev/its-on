const Channel = ({ channel }) => {
  return (
    <div>
      <button>Activate/Deactivate</button>
      <h2>{channel.title}</h2>
      <p>{channel.note || channel.defaultNote}</p>
    </div>
  )
}

export default Channel
