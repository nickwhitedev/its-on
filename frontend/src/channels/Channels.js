const Channels = () => {
  const handleClickCreate = () => console.log('create channel');
  return (
    <div>
      <h2>Channels</h2>
      <button onClick={handleClickCreate}>Create Channel</button>
    </div>
  );
}

export default Channels;
