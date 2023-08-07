import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

jest.mock('../channels/Channels')

test('renders learn react link', () => {
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
