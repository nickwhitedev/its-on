import { createComponent } from '@lit-labs/react'
import { MdOutlinedButton } from '@material/web/button/outlined-button'
import React from 'react'

/**
 * React wrapper for md-outlined-button
 *
 * Defined in node-modules/@material/web/button
 */
const MDOutlinedButton = createComponent({
  tagName: 'md-outlined-button',
  elementClass: MdOutlinedButton,
  react: React,
})

export default MDOutlinedButton
