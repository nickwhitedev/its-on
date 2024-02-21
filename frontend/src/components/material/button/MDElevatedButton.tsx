import { MdElevatedButton } from '@material/web/button/elevated-button'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-elevated-button
 *
 * Defined in node-modules/@material/web/button
 */
const MDElevatedButton = createComponent({
  tagName: 'md-elevated-button',
  elementClass: MdElevatedButton,
  react: React,
})

export default MDElevatedButton
