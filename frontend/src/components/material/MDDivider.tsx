import { MdDivider } from '@material/web/divider/divider'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-divider
 *
 * Defined in node-modules/@material/web/divider
 */
const MDDivider = createComponent({
  tagName: 'md-divider',
  elementClass: MdDivider,
  react: React,
})

export default MDDivider
