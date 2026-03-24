import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoItem } from '../../components/TodoItem'
import type { Todo } from '../../types'

const activeTodo: Todo = {
  id: 1,
  text: 'Buy groceries',
  completed: false,
  createdAt: '2026-03-06T10:00:00.000Z',
}

const completedTodo: Todo = {
  id: 2,
  text: 'Walk the dog',
  completed: true,
  createdAt: '2026-03-06T11:00:00.000Z',
}

const mockOnToggle = vi.fn()

describe('TodoItem', () => {
  beforeEach(() => {
    mockOnToggle.mockReset()
  })

  it('renders active todo text in primary color without strikethrough', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    const text = screen.getByText('Buy groceries')
    expect(text).toBeInTheDocument()
    expect(text).toHaveClass('text-text-primary')
    expect(text).not.toHaveClass('line-through')
    expect(text).not.toHaveClass('italic')
  })

  it('renders completed todo with strikethrough and italic in secondary color', () => {
    render(<TodoItem todo={completedTodo} onToggle={mockOnToggle} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('text-text-secondary')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('italic')
  })

  it('displays creation timestamp as uppercase metadata', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    const timestamp = screen.getByText('Mar 6, 2026')
    expect(timestamp).toBeInTheDocument()
    expect(timestamp).toHaveClass('uppercase')
  })

  it('has role="checkbox" and aria-checked matching completion state', () => {
    const { rerender } = render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    const activeItem = screen.getByRole('checkbox')
    expect(activeItem).toHaveAttribute('aria-checked', 'false')

    rerender(<TodoItem todo={completedTodo} onToggle={mockOnToggle} />)
    const completedItem = screen.getByRole('checkbox')
    expect(completedItem).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onToggle with (id, true) when clicking an active todo', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(mockOnToggle).toHaveBeenCalledWith(1, true)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle with (id, false) when clicking a completed todo', () => {
    render(<TodoItem todo={completedTodo} onToggle={mockOnToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(mockOnToggle).toHaveBeenCalledWith(2, false)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('has cursor-pointer and select-none classes for click affordance', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    const item = screen.getByRole('checkbox')
    expect(item).toHaveClass('cursor-pointer')
    expect(item).toHaveClass('select-none')
  })

  it('has tabIndex={0} for keyboard accessibility', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    const item = screen.getByRole('checkbox')
    expect(item).toHaveAttribute('tabindex', '0')
  })

  it('does not call onToggle when not clicked', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} />)
    expect(mockOnToggle).not.toHaveBeenCalled()
  })
})
