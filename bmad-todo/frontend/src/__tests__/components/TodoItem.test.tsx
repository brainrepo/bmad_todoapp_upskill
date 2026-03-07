import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('TodoItem', () => {
  it('renders active todo text in primary color without strikethrough', () => {
    render(<TodoItem todo={activeTodo} />)
    const text = screen.getByText('Buy groceries')
    expect(text).toBeInTheDocument()
    expect(text).toHaveClass('text-text-primary')
    expect(text).not.toHaveClass('line-through')
    expect(text).not.toHaveClass('italic')
  })

  it('renders completed todo with strikethrough and italic in secondary color', () => {
    render(<TodoItem todo={completedTodo} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('text-text-secondary')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('italic')
  })

  it('displays creation timestamp as uppercase metadata', () => {
    render(<TodoItem todo={activeTodo} />)
    const timestamp = screen.getByText('Mar 6, 2026')
    expect(timestamp).toBeInTheDocument()
    expect(timestamp).toHaveClass('uppercase')
  })

  it('has role="checkbox" and aria-checked matching completion state', () => {
    const { rerender } = render(<TodoItem todo={activeTodo} />)
    const activeItem = screen.getByRole('checkbox')
    expect(activeItem).toHaveAttribute('aria-checked', 'false')

    rerender(<TodoItem todo={completedTodo} />)
    const completedItem = screen.getByRole('checkbox')
    expect(completedItem).toHaveAttribute('aria-checked', 'true')
  })
})
