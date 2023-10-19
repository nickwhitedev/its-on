import { createComponent } from '@lit-labs/react'
import { MdMenuItem } from '@material/web/menu/menu-item'
import React from 'react'

/**
 * React wrapper for md-menu-item
 *
 * Defined in node-modules/@material/web/menu
 */
const MDMenuItem = createComponent({
  tagName: 'md-menu-item',
  elementClass: MdMenuItem,
  react: React,
  events: {
    // {CloseMenuEvent}
    onCloseMenu: 'close-menu',
  },
})

export default MDMenuItem
