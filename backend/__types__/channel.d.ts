interface IChannel {
  // composite id is the public id - stored on the private channel copy
  compositeID?: string
  // defaultNote is for channel management - stored on the private channel copy
  defaultNote?: string
  id: string
  note: string
  on: boolean
  // owner is for public facing channels
  owner?: string
  title: string
}
