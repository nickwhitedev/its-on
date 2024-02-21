import { MdSwitch } from '@material/web/switch/switch'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-switch
 *
 * Defined in node-modules/@material/web/switch
 */
const MDSwitch = createComponent({
  tagName: 'md-switch',
  elementClass: MdSwitch,
  react: React,
  events: {
    // Fired whenever `selected` changes due to user
    // interaction (bubbles and composed).
    onInput: 'input',
    // Fired whenever `selected` changes due to user
    //interaction (bubbles).
    onChange: 'change',
  },
})

export default MDSwitch
