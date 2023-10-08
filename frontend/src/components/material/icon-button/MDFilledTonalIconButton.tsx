import { createComponent } from '@lit-labs/react'
import { MdFilledTonalIconButton } from '@material/web/iconbutton/filled-tonal-icon-button'
import React from 'react'

/**
 * React wrapper for md-filled-tonal-icon-button
 *
 * Defined in node-modules/@material/web/iconbutton
 */
const MDFilledTonalIconButton = createComponent({
  tagName: 'md-filled-tonal-icon-button',
  elementClass: MdFilledTonalIconButton,
  react: React,
})

export default MDFilledTonalIconButton
