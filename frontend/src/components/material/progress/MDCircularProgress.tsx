import { MdCircularProgress } from '@material/web/progress/circular-progress'
import React from 'react'
import { createComponent } from '@lit-labs/react'

/**
 * React wrapper for md-circular-progress
 *
 * Defined in node-modules/@material/web/progress
 */
const MDCircularProgress = createComponent({
  tagName: 'md-circular-progress',
  elementClass: MdCircularProgress,
  react: React,
})

export default MDCircularProgress
