import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoList } from '../../components/TodoList'

const mockUseTodos = vi.fn()

vi.mock('../../hooks/useTodos', () => ({
  useTodos: () => mockUseTodos(),
}))

const mockTodos = [
  { id: 1, text: 'First task', completed: false, createdAt: '2026-03-06T10:00:00Z' },
  { id: 2, text: 'Second task', completed: true, createdAt: '2026-03-06T11:00:00Z' },
]

describe('TodoList', () => {
  it('renders all todos in a list', () => {
    mockUseTodos.mockReturnValue({ todos: mockTodos, isLoading: false, isError: false })
    render(<TodoList />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
  })

  it('renders todos in order (first created first in DOM)', () => {
    mockUseTodos.mockReturnValue({ todos: mockTodos, isLoading: false, isError: false })
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('First task')
    expect(items[1]).toHaveTextContent('Second task')
  })

  it('has role="list" and aria-label="Task list"', () => {
    mockUseTodos.mockReturnValue({ todos: mockTodos, isLoading: false, isError: false })
    render(<TodoList />)
    const list = screen.getByRole('list', { name: 'Task list' })
    expect(list).toBeInTheDocument()
  })

  it('renders nothing when loading', () => {
    mockUseTodos.mockReturnValue({ todos: [], isLoading: true, isError: false })
    const { container } = render(<TodoList />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing on error', () => {
    mockUseTodos.mockReturnValue({ todos: [], isLoading: false, isError: true })
    const { container } = render(<TodoList />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when todos array is empty', () => {
    mockUseTodos.mockReturnValue({ todos: [], isLoading: false, isError: false })
    const { container } = render(<TodoList />)
    expect(container.innerHTML).toBe('')
  })
})
