/** @module utils/serialize */

/**
 * Serializes a dynamodb query response to a response object grouped by item type
 * @param {Array} queryResponse - An array of dynamodb items
 * @return {Object} An object with the items grouped by sort key
 */
export const serializeQueryResponse = (
  queryResponse: Record<string, string>[],
): object => {
  const data: Record<string, object | object[]> = {}

  queryResponse.forEach(item => {
    const { pk, sk, ...itemData } = item

    const isPluralItemType = sk.includes('#')
    const itemKey: string = isPluralItemType
      ? `${sk.substring(0, sk.indexOf('#'))}s`
      : sk

    if (!isPluralItemType) {
      data[itemKey] = { id: pk.substring(pk.indexOf('#') + 1), ...itemData }
      return
    }

    if (!Object.hasOwn(data, itemKey)) {
      data[itemKey] = []
    }

    const itemArray = data[itemKey]

    if (!Array.isArray(itemArray)) {
      throw new Error('Serializer malfunction')
    }
    itemArray.push({
      id: sk.substring(sk.indexOf('#') + 1),
      ...itemData,
    })

    data[itemKey] = itemArray
  })

  return data
}
