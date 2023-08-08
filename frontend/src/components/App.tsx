import './App.css'

import { useCallback, useEffect, useState } from 'react'

import { Link, Outlet } from 'react-router-dom'
import { useChannelsDispatch } from '../contexts/channels/channelsContext'
import logo from '../logo.svg'
import { fetchApi } from '../utils/api'
import { getFullLoginUrl, getTokens, login } from '../utils/auth'
import ProfileMenu from './profile/ProfileMenu'

interface OverviewData {
  channels: IChannel[],
  profile: object,
  subscriptions: IChannel[],
}

const params = new URL(document.location.toString()).searchParams
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
      const response = await fetchApi<OverviewData>('/')

      dispatchChannels({ type: ChannelsDispatchActionType.SYNCED, channels: response.channels ?? [] })
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
        <Link to={'/subscriptions'}>Subscriptions</Link>
        <Link to={'/channels'}>Channels</Link>
        <Outlet />
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
