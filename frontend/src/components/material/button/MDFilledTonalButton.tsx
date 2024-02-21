import { MdFilledTonalButton } from '@material/web/button/filled-tonal-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-filled-tonal-button
 *
 * Defined in node-modules/@material/web/button
 */
const MDFilledTonalButton = createComponent({
  tagName: 'md-filled-tonal-button',
  elementClass: MdFilledTonalButton,
  react: React,
})

export default MDFilledTonalButton
