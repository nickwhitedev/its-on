interface IChannel {
  // composite id is the public id - stored on the private channel copy
  compositeID?: string
  id: string
  note: string
  on: boolean
  owner: string
  title: string
}
