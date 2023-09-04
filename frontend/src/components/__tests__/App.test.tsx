import { render, screen } from '@testing-library/react'

import App from '../App'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../channels/Channels')

describe('App.tsx', () => {
  it('renders logout button', () => {
    // TODO: Add helper renderWithRouter function
    // https://testing-library.com/docs/example-react-router/#reducing-boilerplate
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )
    const linkElement = screen.getByText(/Logout/i)
    expect(linkElement).toBeInTheDocument()
  })
})
