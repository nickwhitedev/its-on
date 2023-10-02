import { MdSelectOption } from '@material/web/select/select-option'
import React from 'react'
import { createComponent } from '@lit-labs/react'

/**
 * React wrapper for md-select-option
 *
 * Defined in node-modules/@material/web/select
 */
const MDSelectOption = createComponent({
  tagName: 'md-select-option',
  elementClass: MdSelectOption,
  react: React,
  events: {
    // Closes the encapsulating menu on
    onCloseMenu: 'close-menu',
    // Requests the parent md-select to select this element
    // (and deselect others if single-selection) when `selected` changed to `true`.
    onRequestSelection: 'request-selection',
    // Requests the parent md-select to deselect this
    // element when `selected` changed to `false`.
    onRequestDeselection: 'request-deselection',
  },
})

export default MDSelectOption
