import './Splash.css'

import { useState } from 'react'
import ItsOnIcon from './icons/ItsOnIcon'
import MDRipple from './material/MDRipple'

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
      <p>
        It&apos;s On is an app for spontaneous low-key invites to your social
        circles for any activity.
      </p>
      <p>
        If you have a group that you regularly see, call, or hang out with,
        It&apos;s On provides an easy way to let them know you&apos;re ready for
        activities.
      </p>
      <p>Invite people to your circles and they will know when It&apos;s On!</p>
    </div>
  )
}

export default Splash
