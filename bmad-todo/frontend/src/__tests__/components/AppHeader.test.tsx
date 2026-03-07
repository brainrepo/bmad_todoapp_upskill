import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppHeader } from '../../components/AppHeader'

describe('AppHeader', () => {
  it('renders the title "things to do"', () => {
    render(<AppHeader />)
    expect(screen.getByText('things to do')).toBeInTheDocument()
  })

  it('renders the subtitle "a simple list"', () => {
    render(<AppHeader />)
    expect(screen.getByText('a simple list')).toBeInTheDocument()
  })
})
