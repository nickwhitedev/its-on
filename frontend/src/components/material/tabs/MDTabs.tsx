import { createComponent } from '@lit-labs/react'
import { MdTabs } from '@material/web/tabs/tabs'
import React from 'react'

/**
 * React wrapper for md-tabs
 *
 * Defined in node-modules/@material/web/tabs
 */
const MDTabs = createComponent({
  tagName: 'md-tabs',
  elementClass: MdTabs,
  react: React,
  events: {
    /**
     * Fired when the selected tab changes. The target's selected or
     * selectedItem and previousSelected or previousSelectedItem provide information
     * about the selection change. The change event is fired when a user interaction
     * like a space/enter key or click cause a selection change. The tab selection
     * based on these actions can be cancelled by calling preventDefault on the
     * triggering `keydown` or `click` event.
     */
    onChange: 'change',
  },
})

export default MDTabs
