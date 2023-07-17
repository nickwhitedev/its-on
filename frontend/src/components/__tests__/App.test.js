import { render, screen } from '@testing-library/react'
import App from '../App.react'

jest.mock('../channels/Channels.react')

test('renders learn react link', () => {
  render(<App />)
  const linkElement = screen.getByText(/Logout/i)
  expect(linkElement).toBeInTheDocument()
})
