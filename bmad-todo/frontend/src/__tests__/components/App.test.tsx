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

  it('uses responsive shell layout on main (mobile full-width, sm centered max-width)', () => {
    renderWithProviders(<App />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('w-full')
    expect(main).toHaveClass('max-w-none')
    expect(main).toHaveClass('sm:max-w-[640px]')
    expect(main).toHaveClass('sm:mx-auto')
    expect(main).toHaveClass('px-4')
    expect(main).toHaveClass('sm:px-12')
  })
})
