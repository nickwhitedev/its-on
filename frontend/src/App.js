import './App.css'

import { getFullLoginUrl, getTokens, login } from './utils/auth'
import { useEffect, useState } from 'react'

import Channels from './channels/Channels'
import ProfileMenu from './profile/ProfileMenu'
import Subscriptions from './subscriptions/Subscriptions'
import { fetchApi } from './utils/api'
import logo from './logo.svg'

const params = new URL(document.location).searchParams
const code = params.get('code')
const state = params.get('state')
const tokens = getTokens()
const App = () => {
  const [authenticated, setAuthenticated] = useState(tokens !== null)
  const [authenticating, setAuthenticating] = useState(code !== null)
  const [loginUrl, setLoginUrl] = useState('')
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
  }, [])

  const handleClickGetOverview = async () => {
    const response = await fetchApi('/')
    console.log(response)
  }

  const getLoginContent = () => {
    if (authenticating) {
      return <div>authenticating...</div>
    }
    if (!authenticated && loginUrl !== '') {
      return (
        <a
          href={loginUrl}
          className="App-link"
        >
          Log in
        </a>
      )
    }
    return (
      <div>
        <ProfileMenu />
        <button onClick={handleClickGetOverview}>Get Overview</button>
        <Channels />
        <Subscriptions />
      </div>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <img
          src={logo}
          className="App-logo"
          alt="logo"
        />
        {getLoginContent()}
      </header>
    </div>
  )
}

export default App
