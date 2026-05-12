import './Splash.css'

import { useEffect, useState } from 'react'
import ItsOnIcon from './icons/ItsOnIcon'
import StoreBadge from 'react-store-badge'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import MDOutlinedButton from './material/button/MDOutlinedButton'
import MDFilledTonalButton from './material/button/MDFilledTonalButton'
import { useGetBrowserDisplayName } from '../utils/browser'
import { useLocation } from 'react-router-dom'

const Splash = () => {
  const getBrowserDisplayName = useGetBrowserDisplayName()
  const { pathname } = useLocation()

  const [isOn, setIsOn] = useState<boolean>(false)
  const [isUsingOnWeb, setIsUsingOnWeb] = useState<boolean>(false)
  const [browserDisplayName, setBrowserDisplayName] =
    useState<string>('Browser')

  useEffect(() => {
    const reloadOnVisible = () => {
      if (document.visibilityState === 'visible') {
        window.location.reload()
      }
    }

    window.addEventListener('visibilitychange', reloadOnVisible)
    return () => {
      window.removeEventListener('visibilitychange', reloadOnVisible)
    }
  })

  useEffect(() => {
    void (async () => {
      setBrowserDisplayName(await getBrowserDisplayName())
    })()
  }, [getBrowserDisplayName])

  const isUsingApp =
    ('standalone' in window.navigator && window.navigator.standalone == true) ||
    window.matchMedia('(display-mode: standalone)').matches

  return (
    <div className='Splash'>
      {!isUsingApp ? (
        <StoreBadge
          name='Its On'
          googlePlayUrl='https://play.google.com/store/apps/details?id=fyi.itson.twa'
          appStoreUrl='https://apps.apple.com/us/app/its-on/id6479501094'
        />
      ) : null}
      {!isUsingApp && !isUsingOnWeb ? (
        <>
          <MDOutlinedButton
            className='Splash-auth-button'
            onClick={() => {
              setIsUsingOnWeb(true)
            }}
          >
            Use on {browserDisplayName}
          </MDOutlinedButton>
        </>
      ) : (
        <div>
          <SignInButton
            mode='modal'
            forceRedirectUrl={pathname}
            signUpForceRedirectUrl={pathname}
          >
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
