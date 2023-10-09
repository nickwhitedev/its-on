import { MdFab } from '@material/web/fab/fab'
import React from 'react'
import { createComponent } from '@lit-labs/react'

/**
 * React wrapper for md-fab
 *
 * Defined in node-modules/@material/web/fab
 */
const MDFab = createComponent({
  tagName: 'md-fab',
  elementClass: MdFab,
  react: React,
})

export default MDFab
