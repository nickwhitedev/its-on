import { createComponent } from '@lit-labs/react'
import { MdIconButton } from '@material/web/iconbutton/icon-button'
import React from 'react'

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
