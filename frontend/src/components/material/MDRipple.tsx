import { createComponent } from '@lit/react'
import { MdRipple } from '@material/web/ripple/ripple'
import React from 'react'

/**
 * React wrapper for md-ripple
 *
 * Defined in node-modules/@material/web/ripple
 */
const MDRipple = createComponent({
  tagName: 'md-ripple',
  elementClass: MdRipple,
  react: React,
})

export default MDRipple
