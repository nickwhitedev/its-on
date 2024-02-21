import { MdElevation } from '@material/web/elevation/elevation'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-elevation
 *
 * Defined in node-modules/@material/web/elevation
 */
const MDElevation = createComponent({
  tagName: 'md-elevation',
  elementClass: MdElevation,
  react: React,
})

export default MDElevation
