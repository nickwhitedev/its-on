import { createComponent } from '@lit-labs/react'
import { MdList } from '@material/web/list/list'
import React from 'react'

/**
 * React wrapper for md-list
 *
 * Defined in node-modules/@material/web/list
 */
const MDList = createComponent({
  tagName: 'md-list',
  elementClass: MdList,
  react: React,
})

export default MDList
