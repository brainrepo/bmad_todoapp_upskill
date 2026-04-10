import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingState } from '../../components/LoadingState'

describe('LoadingState', () => {
  it('renders "Loading..." text', () => {
    render(<LoadingState />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('text has correct styling classes', () => {
    render(<LoadingState />)
    const text = screen.getByText('Loading...')
    expect(text).toHaveClass('text-sm')
    expect(text).toHaveClass('text-text-placeholder')
  })

  it('does not contain any spinner, image, or svg elements', () => {
    const { container } = render(<LoadingState />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })
})
