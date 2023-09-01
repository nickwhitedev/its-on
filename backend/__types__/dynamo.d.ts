interface IDynamoChannelItem {
  note: string
  on: boolean
  owner: string
  pk: string
  sk: string
  title: string
}

interface IDynamoStreamChannelImage {
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
