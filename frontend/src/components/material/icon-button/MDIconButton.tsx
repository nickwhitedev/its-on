import { MdIconButton } from '@material/web/iconbutton/icon-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-icon-button
 *
 * Defined in node-modules/@material/web/iconbutton
 */
const MDIconButton = createComponent({
  tagName: 'md-icon-button',
  elementClass: MdIconButton,
  react: React,
})

export default MDIconButton
