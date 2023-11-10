import { MdPrimaryTab } from '@material/web/tabs/primary-tab'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-primary-tab
 *
 * Defined in node-modules/@material/web/tabs
 */
const MDPrimaryTab = createComponent({
  tagName: 'md-primary-tab',
  elementClass: MdPrimaryTab,
  react: React,
})

export default MDPrimaryTab
