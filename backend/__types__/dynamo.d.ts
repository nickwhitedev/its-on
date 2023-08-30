interface IDynamoChannelItem {
  // composite id is the public id - stored on the private channel copy
  compositeID?: string
  note: string
  on: boolean
  owner: string
  pk: string
  sk: string
  title: string
}

interface IDynamoStreamChannelImage {
  compositeID: {
    S: string
  }
  note: {
    S: string
  }
  on: {
    BOOL: boolean
  }
  owner: {
    S: string
  }
  pk: {
    S: string
  }
  sk: {
    S: string
  }
  title: {
    S: string
  }
}
