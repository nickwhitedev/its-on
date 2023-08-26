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
    const isPluralItemType = item.sk.includes('#')
    const itemKey: string = isPluralItemType
      ? `${item.sk.substring(0, item.sk.indexOf('#'))}s`
      : item.sk
    const { _pk, _sk, ...itemData } = item

    if (!isPluralItemType) {
      data[itemKey] = itemData
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
      id: item.sk.substring(item.sk.indexOf('#') + 1),
      ...itemData,
    })

    data[itemKey] = itemArray
  })

  return data
}
