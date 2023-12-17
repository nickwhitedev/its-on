import { render, screen } from '@testing-library/react'

import { Authenticator } from '@aws-amplify/ui-react'
import { Amplify } from 'aws-amplify'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import amplifyConfig from '../../amplifyConfig'
import App from '../App'

Amplify.configure(amplifyConfig)

vi.mock('../channels/Channels')

describe('App.tsx', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders channels link', () => {
    render(
      <Authenticator.Provider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Authenticator.Provider>,
    )
    const linkElement = screen.getByText(/Loading/i)
    expect(linkElement).toBeInTheDocument()
  })
})
