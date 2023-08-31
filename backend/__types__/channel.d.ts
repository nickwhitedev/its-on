interface IChannel {
  id: string
  note: string
  on: boolean
  // owner is for public facing channels
  owner?: string
  title: string
}
