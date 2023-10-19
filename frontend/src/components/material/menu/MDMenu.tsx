import { createComponent } from '@lit-labs/react'
import { MdMenu } from '@material/web/menu/menu'
import React from 'react'

/**
 * React wrapper for md-menu
 *
 * Defined in node-modules/@material/web/menu
 */
const MDMenu = createComponent({
  tagName: 'md-menu',
  elementClass: MdMenu,
  react: React,
  events: {
    // Fired before the opening animation begins
    onOpening: 'opening',
    // Fired once the menu is open, after any animations
    onOpened: 'opened',
    // Fired before the closing animation begins1
    onClosing: 'closing',
    // Fired once the menu is closed, after any animations
    onClosed: 'closed',
  },
})

export default MDMenu
