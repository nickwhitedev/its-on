import './App.css'

import { useCallback, useEffect, useState } from 'react'
import { getFullLoginUrl, getTokens, login } from '../utils/auth'

import { useChannelsDispatch } from '../contexts/ChannelsContext'
import logo from '../logo.svg'
import { fetchApi } from '../utils/api'
import Channels from './channels/Channels'
import ProfileMenu from './profile/ProfileMenu'
import Subscriptions from './subscriptions/Subscriptions'

const params = new URL(document.location).searchParams
const code = params.get('code')
const state = params.get('state')
const tokens = getTokens()
const App = () => {
  const [authenticated, setAuthenticated] = useState(tokens !== null)
  const [authenticating, setAuthenticating] = useState(code !== null)
  const [loginUrl, setLoginUrl] = useState('')

  const dispatchChannels = useChannelsDispatch()

  const syncOverview = useCallback(async () => {
    try {
      const response = await fetchApi('/')
      console.log(response)

      dispatchChannels({ type: 'synced', channels: response.channels })
    } catch (error) {
      // TODO: handle overview fetch error
      // Log error to backend
      // Show user-friendly message
    }
  }, [dispatchChannels])

  useEffect(() => {
    const setFullLoginUrl = async () => {
      const fullLoginUrl = await getFullLoginUrl()
      setLoginUrl(fullLoginUrl)
    }

    const finishLogin = async () => {
      window.history.replaceState({}, document.title, '/')
      try {
        await login(code, state)
        setAuthenticated(true)
      } catch (err) {
        // TODO: Login error handling
      }
      setAuthenticating(false)
    }

    setFullLoginUrl()
    if (code !== null && state !== null) {
      finishLogin()
    }
    if (authenticated) syncOverview()
  }, [authenticated, syncOverview])

  const getContent = () => {
    if (authenticating) {
      return <div>authenticating...</div>
    }
    if (!authenticated && loginUrl !== '') {
      return (
        <a
          href={loginUrl}
          className='App-link'
        >
          Log in
        </a>
      )
    }
    return (
      <div>
        <ProfileMenu />
        <Channels />
        <Subscriptions />
      </div>
    )
  }

  return (
    <div className='App'>
      <header className='App-header'>
        <img
          src={logo}
          className='App-logo'
          alt='logo'
        />
        {getContent()}
      </header>
    </div>
  )
}

export default App
