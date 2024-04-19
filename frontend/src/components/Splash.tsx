import './Splash.css'

import { useState } from 'react'
import ItsOnIcon from './icons/ItsOnIcon'
import MDRipple from './material/MDRipple'
import StoreBadge from 'react-store-badge'

const Splash = () => {
  const [isOn, setIsOn] = useState<boolean>(false)

  return (
    <div className='Splash'>
      <button
        aria-label={isOn ? 'Turn off channel' : 'Turn on channel'}
        className={`Splash-button ${isOn ? 'on' : ''}`}
        onClick={() => {
          setIsOn(prev => !prev)
        }}
      >
        <MDRipple />
        <ItsOnIcon className='Splash-button-image' />
      </button>
      {('standalone' in window.navigator && window.navigator.standalone) ||
      window.matchMedia('(display-mode: standalone)').matches ? null : (
        <StoreBadge
          name='Its On'
          googlePlayUrl='https://play.google.com/store/apps/details?id=fyi.itson.twa'
          appStoreUrl='https://apps.apple.com/us/app/its-on/id6479501094'
        />
      )}
      <p>
        It&apos;s On is a way to send low-pressure invites to small groups of
        people.
      </p>
      <p>
        If you&apos;ve been looking for a way to let people know you&apos;re
        available without interrupting or needing a response from them,
        you&apos;ve found it.
      </p>
      <p>
        Create your own channels, share them with your friends, and let them
        know It&apos;s On!
      </p>
    </div>
  )
}

export default Splash
