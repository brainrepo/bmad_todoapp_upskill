import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorNotification } from '../../components/ErrorNotification'

describe('ErrorNotification', () => {
  it('renders message text when message is non-null', () => {
    render(<ErrorNotification message="Task not saved — try again" />)
    expect(screen.getByText('Task not saved — try again')).toBeInTheDocument()
  })

  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorNotification message={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('has role="alert" and aria-live="polite"', () => {
    render(<ErrorNotification message="Error" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('has correct styling classes', () => {
    render(<ErrorNotification message="Error" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('fixed', 'bg-surface', 'border-l-2', 'border-error')
  })

  it('has correct text styling', () => {
    render(<ErrorNotification message="Error" />)
    const text = screen.getByText('Error')
    expect(text).toHaveClass('text-sm', 'text-text-primary')
  })
})
