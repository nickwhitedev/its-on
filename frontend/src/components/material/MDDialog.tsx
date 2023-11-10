import { MdDialog } from '@material/web/dialog/dialog'
import React from 'react'
import { createComponent } from '@lit/react'

/**
 * React wrapper for md-dialog
 *
 * Defined in node-modules/@material/web/dialog
 */
const MDDialog = createComponent({
  tagName: 'md-dialog',
  elementClass: MdDialog,
  react: React,
  events: {
    // Fires open Dispatched when the dialog is opening before any animations.
    onOpen: 'open',
    // Fires opened Dispatched when the dialog has opened after any animations.
    onOpened: 'opened',
    // Fires close Dispatched when the dialog is closing before any animations.
    onClose: 'close',
    // Fires closed Dispatched when the dialog has closed after any animations.
    onClosed: 'closed',
    // Fires cancel Dispatched when the dialog has been canceled by clicking on
    // the scrim or pressing Escape.
    onCancel: 'cancel',
  },
})

export default MDDialog
