import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '../../components/App'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('App', () => {
  it('renders the app title', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('things to do')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('a simple list')).toBeInTheDocument()
  })
})
