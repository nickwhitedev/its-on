import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-outlined-text-field
 *
 * Defined in node-modules/@material/web/textfield
 */
const MDOutlinedTextField = createComponent({
  tagName: 'md-outlined-text-field',
  elementClass: MdOutlinedTextField,
  react: React,
  events: {
    onChange: 'change',
    onInput: 'input',
  },
})

export default MDOutlinedTextField
