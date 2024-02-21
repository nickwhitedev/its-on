import { MdTextButton } from '@material/web/button/text-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-text-button
 *
 * Defined in node-modules/@material/web/button
 */
const MDTextButton = createComponent({
  tagName: 'md-text-button',
  elementClass: MdTextButton,
  react: React,
})

export default MDTextButton
