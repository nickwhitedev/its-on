import { MdLinearProgress } from '@material/web/progress/linear-progress'
import React from 'react'
import { createComponent } from '@lit-labs/react'

/**
 * React wrapper for md-linear-progress
 *
 * Defined in node-modules/@material/web/progress
 */
const MDLinearProgress = createComponent({
  tagName: 'md-linear-progress',
  elementClass: MdLinearProgress,
  react: React,
})

export default MDLinearProgress
