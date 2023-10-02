import { MdOutlinedSelect } from '@material/web/select/outlined-select'
import React from 'react'
import { createComponent } from '@lit-labs/react'

/**
 * React wrapper for md-outlined-select
 *
 * Defined in node-modules/@material/web/select
 */
const MDOutlinedSelect = createComponent({
  tagName: 'md-outlined-select',
  elementClass: MdOutlinedSelect,
  react: React,
  events: {
    // Fired when a selection is made by the user via mouse or keyboard
    // interaction.
    onInput: 'input',
    // Fired when a selection is made by the user via mouse or
    // keyboard interaction.
    onChange: 'change',
    // Fired when the select's menu is about to open.
    onOpening: 'opening',
    // Fired when the select's menu has finished animations and
    // opened.
    onOpened: 'opened',
    // Fired when the select's menu is about to close.
    onClosing: 'closing',
    // Fired when the select's menu has finished animations and
    // closed.
    onClosed: 'closed',
  },
})

export default MDOutlinedSelect
