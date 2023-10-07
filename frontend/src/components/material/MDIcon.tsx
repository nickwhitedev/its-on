import { createComponent } from '@lit-labs/react'
import { MdIcon } from '@material/web/icon/icon'
import React from 'react'

/**
 * React wrapper for md-icon
 *
 * Defined in node-modules/@material/web/icon
 */
const MDIcon = createComponent({
  tagName: 'md-icon',
  elementClass: MdIcon,
  react: React,
})

export default MDIcon
