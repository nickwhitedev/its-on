/** @module utils/serialize */

/**
 * Serializes a dynamodb query response to a response object grouped by item type
 * @param {Array} queryResponse - An array of dynamodb items
 * @return {Object} An object with the items grouped by sort key
 */
export const serializeQueryResponse = queryResponse => {
  const data = {}

  queryResponse.forEach(item => {
    const isPluralItemType = item.sk.includes('#')
    const itemKey = isPluralItemType
      ? `${item.sk.substring(0, item.sk.indexOf('#'))}s`
      : item.sk

    if (!isPluralItemType) {
      data[itemKey] = item
      return
    }

    if (!Object.hasOwn(data, itemKey)) data[itemKey] = []
    data[itemKey].push(item)
  })

  return data
}
