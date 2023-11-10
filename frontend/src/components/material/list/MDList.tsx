import { MdList } from '@material/web/list/list'
import React from 'react'
import { createComponent } from '@lit/react'

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
