import { MdListItem } from '@material/web/list/list-item'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-list-item
 *
 * Defined in node-modules/@material/web/list
 */
const MDListItem = createComponent({
  tagName: 'md-list-item',
  elementClass: MdListItem,
  react: React,
  events: {
    onRequestActivation: 'request-activation',
  },
})

export default MDListItem
