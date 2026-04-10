import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../../components/EmptyState'

describe('EmptyState', () => {
  it('renders heading "Nothing here yet"', () => {
    render(<EmptyState />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('heading has correct styling classes', () => {
    render(<EmptyState />)
    const heading = screen.getByText('Nothing here yet')
    expect(heading).toHaveClass('text-xl')
    expect(heading).toHaveClass('font-light')
    expect(heading).toHaveClass('text-text-secondary')
  })

  it('renders subtext "Type above and press Enter"', () => {
    render(<EmptyState />)
    expect(screen.getByText('Type above and press Enter')).toBeInTheDocument()
  })

  it('subtext has correct styling classes', () => {
    render(<EmptyState />)
    const subtext = screen.getByText('Type above and press Enter')
    expect(subtext).toHaveClass('text-sm')
    expect(subtext).toHaveClass('text-text-placeholder')
  })

  it('heading uses h2 element', () => {
    render(<EmptyState />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Nothing here yet')
  })

  it('container is centered', () => {
    render(<EmptyState />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.closest('div')).toHaveClass('text-center')
  })
})
