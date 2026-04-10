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
const mockOnDelete = vi.fn()

describe('TodoItem', () => {
  beforeEach(() => {
    mockOnToggle.mockReset()
    mockOnDelete.mockReset()
  })

  it('renders active todo text in primary color without strikethrough', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const text = screen.getByText('Buy groceries')
    expect(text).toBeInTheDocument()
    expect(text).toHaveClass('text-text-primary')
    expect(text).not.toHaveClass('line-through')
    expect(text).not.toHaveClass('italic')
  })

  it('renders completed todo with strikethrough and italic in secondary color', () => {
    render(<TodoItem todo={completedTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('text-text-secondary')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('italic')
  })

  it('displays creation timestamp as uppercase metadata', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const timestamp = screen.getByText('Mar 6, 2026')
    expect(timestamp).toBeInTheDocument()
    expect(timestamp).toHaveClass('uppercase')
  })

  it('has role="checkbox" and aria-checked matching completion state', () => {
    const { rerender } = render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const activeItem = screen.getByRole('checkbox')
    expect(activeItem).toHaveAttribute('aria-checked', 'false')

    rerender(<TodoItem todo={completedTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const completedItem = screen.getByRole('checkbox')
    expect(completedItem).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onToggle with (id, true) when clicking an active todo', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(mockOnToggle).toHaveBeenCalledWith(1, true)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle with (id, false) when clicking a completed todo', () => {
    render(<TodoItem todo={completedTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(mockOnToggle).toHaveBeenCalledWith(2, false)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('has cursor-pointer and select-none classes for click affordance', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const item = screen.getByRole('checkbox')
    expect(item).toHaveClass('cursor-pointer')
    expect(item).toHaveClass('select-none')
  })

  it('has tabIndex={0} for keyboard accessibility', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const item = screen.getByRole('checkbox')
    expect(item).toHaveAttribute('tabindex', '0')
  })

  it('supports roving tabindex when tabIndex is -1', () => {
    render(
      <TodoItem
        todo={activeTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        tabIndex={-1}
      />,
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('tabindex', '-1')
  })

  it('shows focus ring classes on the task row', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const item = screen.getByRole('checkbox')
    expect(item).toHaveClass('focus:ring-2')
    expect(item).toHaveClass('focus:ring-accent')
    expect(item).toHaveClass('focus:ring-offset-2')
    expect(item).toHaveClass('focus:ring-offset-bg')
  })

  it('sets delete button tabIndex to -1 for roving list focus', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    expect(screen.getByLabelText('Delete task: Buy groceries')).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })

  it('does not call onToggle when not clicked', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    expect(mockOnToggle).not.toHaveBeenCalled()
  })

  it('renders × delete button with correct aria-label', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete task: Buy groceries')
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton.textContent).toBe('×')
  })

  it('calls onDelete with todo id when × button is clicked', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete task: Buy groceries')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith(1)
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onToggle when × button is clicked (stopPropagation)', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete task: Buy groceries')
    fireEvent.click(deleteButton)
    expect(mockOnToggle).not.toHaveBeenCalled()
  })

  it('× delete button has minimum 44x44px touch target classes', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete task: Buy groceries')
    expect(deleteButton).toHaveClass('w-11')
    expect(deleteButton).toHaveClass('h-11')
  })

  it('task row has min-height 44px for touch targets', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    expect(screen.getByRole('checkbox')).toHaveClass('min-h-[44px]')
  })

  it('delete control is visible by default; lg hides until row hover (progressive affordance)', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete task: Buy groceries')
    expect(deleteButton).toHaveClass('opacity-100')
    expect(deleteButton).toHaveClass('lg:opacity-0')
    expect(deleteButton).toHaveClass('lg:group-hover:opacity-100')
  })

  it('applies left border and surface hover on lg+ hover only', () => {
    render(<TodoItem todo={activeTodo} onToggle={mockOnToggle} onDelete={mockOnDelete} />)
    const item = screen.getByRole('checkbox')
    expect(item).toHaveClass('lg:hover:border-border')
    expect(item).toHaveClass('lg:hover:bg-surface-hover')
  })
})
