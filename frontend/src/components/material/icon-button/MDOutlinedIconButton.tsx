import { MdOutlinedIconButton } from '@material/web/iconbutton/outlined-icon-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-outlined-icon-button
 *
 * Defined in node-modules/@material/web/iconbutton
 */
const MDOutlinedIconButton = createComponent({
  tagName: 'md-outlined-icon-button',
  elementClass: MdOutlinedIconButton,
  react: React,
})

export default MDOutlinedIconButton
