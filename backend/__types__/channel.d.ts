interface IChannel {
  // composite id is the public id - stored on the private channel copy
  compositeID?: string
  id: string
  note: string
  on: boolean
  // owner is for public facing channels
  owner?: string
  title: string
}
