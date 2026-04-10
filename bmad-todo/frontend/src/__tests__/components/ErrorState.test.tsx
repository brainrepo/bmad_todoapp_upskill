import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorState } from '../../components/ErrorState'

describe('ErrorState', () => {
  it('renders heading "Something\'s not right"', () => {
    render(<ErrorState onRetry={vi.fn()} />)
    expect(screen.getByText("Something's not right")).toBeInTheDocument()
  })

  it('heading has correct styling classes', () => {
    render(<ErrorState onRetry={vi.fn()} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveClass('text-xl', 'font-light', 'text-text-secondary')
  })

  it('renders "Try again" link with accent color', () => {
    render(<ErrorState onRetry={vi.fn()} />)
    const link = screen.getByText('Try again')
    expect(link).toBeInTheDocument()
    expect(link).toHaveClass('text-accent', 'cursor-pointer')
  })

  it('shows visible focus ring on Try again (keyboard / a11y)', () => {
    render(<ErrorState onRetry={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'Try again' })
    expect(btn).toHaveClass('focus:ring-2')
    expect(btn).toHaveClass('focus:ring-accent')
    expect(btn).toHaveClass('focus:ring-offset-2')
    expect(btn).toHaveClass('focus:ring-offset-bg')
  })

  it('calls onRetry when "Try again" is clicked', () => {
    const mockRetry = vi.fn()
    render(<ErrorState onRetry={mockRetry} />)
    fireEvent.click(screen.getByText('Try again'))
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('container is centered', () => {
    render(<ErrorState onRetry={vi.fn()} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.closest('div')).toHaveClass('text-center')
  })
})
