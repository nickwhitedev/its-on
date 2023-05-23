import logo from './logo.svg';
import './App.css';
import React, { useCallback, useEffect, useState } from 'react';
import { getFullLoginUrl, fullLogoutUrl, getTokens, login, logout } from './utils/auth';

const params = (new URL(document.location)).searchParams;
const code = params.get('code');
const state = params.get('state');
const tokens = getTokens();
function App() {
  const [authenticated, setAuthenticated] = useState(tokens !== null);
  const [authenticating, setAuthenticating] = useState(code !== null);
  const [loginUrl, setLoginUrl] = useState('');
  useEffect(() => {
    const setFullLoginUrl = async () => {
      const fullLoginUrl = await getFullLoginUrl();
      setLoginUrl(fullLoginUrl);
    }

    const finishLogin = async () => {
      window.history.replaceState({}, document.title, '/');
      try {
        await login(code, state);
        setAuthenticated(true);
      } catch (err) {
        // TODO: Login error handling
      }
      setAuthenticating(false);
    };

    setFullLoginUrl()
    if (code !== null && state !== null) {
      finishLogin();
    }
  }, []);

  const handleClick = useCallback(() => {
    logout();
    window.location.assign(fullLogoutUrl);
  }, []);

  const getLoginContent = () => {
    if (authenticating) {
      return <div>authenticating...</div>
    }
    if (!authenticated && loginUrl !== '') {
      return <a href={loginUrl} className="App-link">Log in</a>
    }
    return <button onClick={handleClick}>Logout</button>
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {getLoginContent()}
      </header>
    </div>
  );
}

export default App;
