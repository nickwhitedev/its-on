import { MdFilledIconButton } from '@material/web/iconbutton/filled-icon-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-filled-icon-button
 *
 * Defined in node-modules/@material/web/iconbutton
 */
const MDFilledIconButton = createComponent({
  tagName: 'md-filled-icon-button',
  elementClass: MdFilledIconButton,
  react: React,
})

export default MDFilledIconButton
