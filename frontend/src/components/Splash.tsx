import './Splash.css'

import { useState } from 'react'
import ItsOnIcon from './icons/ItsOnIcon'
import MDRipple from './material/MDRipple'
import StoreBadge from 'react-store-badge'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import MDOutlinedButton from './material/button/MDOutlinedButton'
import MDFilledTonalButton from './material/button/MDFilledTonalButton'
import { browserName } from 'detect-browser'

const Splash = () => {
  const browser = browserName(navigator.userAgent) ?? 'browser'

  const [isOn, setIsOn] = useState<boolean>(false)
  const [useOnWeb, setUseOnWeb] = useState<boolean>(false)

  const isUsingApp =
    (('standalone' in window.navigator && window.navigator.standalone) ||
      window.matchMedia('(display-mode: standalone)').matches) == true

  return (
    <div className='Splash'>
      {!isUsingApp ? (
        <StoreBadge
          name='Its On'
          googlePlayUrl='https://play.google.com/store/apps/details?id=fyi.itson.twa'
          appStoreUrl='https://apps.apple.com/us/app/its-on/id6479501094'
        />
      ) : null}
      {!isUsingApp && !useOnWeb ? (
        <>
          <MDOutlinedButton
            className='Splash-auth-button'
            onClick={() => {
              setUseOnWeb(true)
            }}
          >
            Use in {browser[0].toUpperCase() + browser.slice(1)}
          </MDOutlinedButton>
        </>
      ) : (
        <div>
          <SignInButton mode='modal'>
            <MDOutlinedButton className='Splash-auth-button'>
              Sign In
            </MDOutlinedButton>
          </SignInButton>
          <SignUpButton mode='modal'>
            <MDFilledTonalButton className='Splash-auth-button'>
              Sign Up
            </MDFilledTonalButton>
          </SignUpButton>
        </div>
      )}
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
