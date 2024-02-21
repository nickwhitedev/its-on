import { MdFilledButton } from '@material/web/button/filled-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-filled-button
 *
 * Defined in node-modules/@material/web/button
 */
const MDFilledButton = createComponent({
  tagName: 'md-filled-button',
  elementClass: MdFilledButton,
  react: React,
})

export default MDFilledButton
