import { fetchApi } from "../utils/api";

const Channels = () => {
  const handleClickCreate = () => {
    fetchApi(
      '/channels',
      'POST',
      {
        defaultNote: 'default note',
        title: 'test-channel',
      }
    )
  }
  return (
    <div>
      <h2>Channels</h2>
      <button onClick={handleClickCreate}>Create Channel</button>
    </div>
  );
}

export default Channels;
