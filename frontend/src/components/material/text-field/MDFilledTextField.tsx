import { MdFilledTextField } from '@material/web/textfield/filled-text-field'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-filled-text-field
 *
 * Defined in node-modules/@material/web/textfield
 */
const MDFilledTextField = createComponent({
  tagName: 'md-filled-text-field',
  elementClass: MdFilledTextField,
  react: React,
  events: {
    onChange: 'change',
    onInput: 'input',
  },
})

export default MDFilledTextField
