import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoInput } from '../../components/TodoInput'

const mockMutate = vi.fn()
vi.mock('../../hooks/useTodos', () => ({
  useCreateTodo: () => ({ mutate: mockMutate }),
}))

describe('TodoInput', () => {
  beforeEach(() => {
    mockMutate.mockReset()
  })

  it('renders with placeholder "What needs doing?"', () => {
    render(<TodoInput />)
    expect(screen.getByPlaceholderText('What needs doing?')).toBeInTheDocument()
  })

  it('has minimum 44px height for touch target', () => {
    render(<TodoInput />)
    expect(screen.getByPlaceholderText('What needs doing?')).toHaveClass('min-h-[44px]')
  })

  it('auto-focuses on mount', () => {
    render(<TodoInput />)
    expect(screen.getByPlaceholderText('What needs doing?')).toHaveFocus()
  })

  it('calls createTodo mutation and clears input on Enter with text', async () => {
    const user = userEvent.setup()
    render(<TodoInput />)

    const input = screen.getByPlaceholderText('What needs doing?')
    await user.type(input, 'Buy groceries')
    await user.keyboard('{Enter}')

    expect(mockMutate).toHaveBeenCalledWith('Buy groceries')
    expect(input).toHaveValue('')
  })

  it('does nothing on Enter with empty input', async () => {
    const user = userEvent.setup()
    render(<TodoInput />)

    await user.keyboard('{Enter}')

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does nothing on Enter with whitespace-only input', async () => {
    const user = userEvent.setup()
    render(<TodoInput />)

    const input = screen.getByPlaceholderText('What needs doing?')
    await user.type(input, '   ')
    await user.keyboard('{Enter}')

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('trims text before submission', async () => {
    const user = userEvent.setup()
    render(<TodoInput />)

    const input = screen.getByPlaceholderText('What needs doing?')
    await user.type(input, '  Buy groceries  ')
    await user.keyboard('{Enter}')

    expect(mockMutate).toHaveBeenCalledWith('Buy groceries')
  })

  it('clears input on Escape key', async () => {
    const user = userEvent.setup()
    render(<TodoInput />)

    const input = screen.getByPlaceholderText('What needs doing?')
    await user.type(input, 'Some text')
    await user.keyboard('{Escape}')

    expect(input).toHaveValue('')
  })

  it('retains focus after submission', async () => {
    const user = userEvent.setup()
    render(<TodoInput />)

    const input = screen.getByPlaceholderText('What needs doing?')
    await user.type(input, 'Test focus')
    await user.keyboard('{Enter}')

    expect(input).toHaveFocus()
  })

  it('has aria-label "Add a new task"', () => {
    render(<TodoInput />)
    expect(screen.getByLabelText('Add a new task')).toBeInTheDocument()
  })
})
