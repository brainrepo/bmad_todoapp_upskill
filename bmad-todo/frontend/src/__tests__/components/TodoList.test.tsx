import { createRef } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoList } from '../../components/TodoList'

const mockUseTodos = vi.fn()
const mockRefetch = vi.fn()
const mockToggleMutate = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock('../../hooks/useTodos', () => ({
  useTodos: () => mockUseTodos(),
  useToggleTodo: () => ({ mutate: mockToggleMutate }),
  useDeleteTodo: () => ({ mutate: mockDeleteMutate }),
}))

const mockTodos = [
  { id: 1, text: 'First task', completed: false, createdAt: '2026-03-06T10:00:00Z' },
  { id: 2, text: 'Second task', completed: true, createdAt: '2026-03-06T11:00:00Z' },
]

function mockTodosState(overrides: Record<string, unknown> = {}) {
  return {
    todos: [] as typeof mockTodos,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: mockRefetch,
    ...overrides,
  }
}

describe('TodoList', () => {
  beforeEach(() => {
    mockUseTodos.mockReset()
    mockToggleMutate.mockReset()
    mockDeleteMutate.mockReset()
  })

  it('renders all todos in a list', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
  })

  it('renders todos in order (first created first in DOM)', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('First task')
    expect(items[1]).toHaveTextContent('Second task')
  })

  it('has role="list" and aria-label="Task list"', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const list = screen.getByRole('list', { name: 'Task list' })
    expect(list).toBeInTheDocument()
  })

  it('renders LoadingState when loading', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ isLoading: true }))
    render(<TodoList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('sets aria-live and aria-busy on the list region while loading', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ isLoading: true }))
    render(<TodoList />)
    const list = screen.getByRole('list', { name: 'Task list' })
    expect(list).toHaveAttribute('aria-live', 'polite')
    expect(list).toHaveAttribute('aria-busy', 'true')
  })

  it('renders ErrorState on error with retry', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ isError: true }))
    render(<TodoList />)
    expect(screen.getByText("Something's not right")).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('calls refetch when "Try again" is clicked', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ isError: true }))
    render(<TodoList />)
    fireEvent.click(screen.getByText('Try again'))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('renders LoadingState while refetching after error (Try again)', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ isError: true, isFetching: true }))
    render(<TodoList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText("Something's not right")).not.toBeInTheDocument()
  })

  it('renders EmptyState when todos array is empty', () => {
    mockUseTodos.mockReturnValue(mockTodosState())
    render(<TodoList />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText('Type above and press Enter')).toBeInTheDocument()
  })

  it('calls toggle mutation when a todo is clicked', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')

    fireEvent.click(items[0])
    expect(mockToggleMutate).toHaveBeenCalledWith({ id: 1, completed: true })

    mockToggleMutate.mockClear()
    fireEvent.click(items[1])
    expect(mockToggleMutate).toHaveBeenCalledWith({ id: 2, completed: false })
  })

  it('calls delete mutation when × button is clicked', () => {
    vi.useFakeTimers()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const deleteButton = screen.getByLabelText('Delete task: First task')
    fireEvent.click(deleteButton)
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ onSettled: expect.any(Function) }),
    )
    vi.useRealTimers()
  })

  it('flushes pending delete when × is clicked on another task before fade completes', () => {
    vi.useFakeTimers()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    fireEvent.click(screen.getByLabelText('Delete task: First task'))
    fireEvent.click(screen.getByLabelText('Delete task: Second task'))
    expect(mockDeleteMutate).toHaveBeenCalledTimes(1)
    expect(mockDeleteMutate).toHaveBeenCalledWith(1)
    mockDeleteMutate.mockClear()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(mockDeleteMutate).toHaveBeenCalledTimes(1)
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ onSettled: expect.any(Function) }),
    )
    vi.useRealTimers()
  })

  it('does not trigger toggle when × button is clicked', () => {
    vi.useFakeTimers()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const deleteButton = screen.getByLabelText('Delete task: First task')
    fireEvent.click(deleteButton)
    expect(mockToggleMutate).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(mockToggleMutate).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('gives first task tabIndex 0 and others -1 (roving focus)', () => {
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
  })

  it('moves focus from input to first task on Tab', async () => {
    const user = userEvent.setup()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    const inputRef = createRef<HTMLInputElement>()
    render(
      <>
        <input ref={inputRef} aria-label="Harness input" />
        <TodoList inputRef={inputRef} />
      </>,
    )
    inputRef.current?.focus()
    await user.tab()
    expect(screen.getAllByRole('checkbox')[0]).toHaveFocus()
  })

  it('moves focus to next task on ArrowDown', async () => {
    const user = userEvent.setup()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    items[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
  })

  it('moves focus to previous task on ArrowUp', async () => {
    const user = userEvent.setup()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    items[1].focus()
    await user.keyboard('{ArrowUp}')
    expect(items[0]).toHaveFocus()
  })

  it('moves focus from first task to input on ArrowUp', async () => {
    const user = userEvent.setup()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    const inputRef = createRef<HTMLInputElement>()
    render(
      <>
        <input ref={inputRef} aria-label="Harness input" />
        <TodoList inputRef={inputRef} />
      </>,
    )
    screen.getAllByRole('checkbox')[0].focus()
    await user.keyboard('{ArrowUp}')
    expect(inputRef.current).toHaveFocus()
  })

  it('toggles task on Space when row is focused', async () => {
    const user = userEvent.setup()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    items[0].focus()
    await user.keyboard(' ')
    expect(mockToggleMutate).toHaveBeenCalledWith({ id: 1, completed: true })
  })

  it('toggles task on Enter when row is focused', async () => {
    const user = userEvent.setup()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const items = screen.getAllByRole('checkbox')
    items[0].focus()
    await user.keyboard('{Enter}')
    expect(mockToggleMutate).toHaveBeenCalledWith({ id: 1, completed: true })
  })

  it('deletes task on Delete when row is focused', () => {
    vi.useFakeTimers()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const first = screen.getAllByRole('checkbox')[0]
    first.focus()
    fireEvent.keyDown(first, { key: 'Delete' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ onSettled: expect.any(Function) }),
    )
    vi.useRealTimers()
  })

  it('deletes task on Backspace when row is focused', () => {
    vi.useFakeTimers()
    mockUseTodos.mockReturnValue(mockTodosState({ todos: mockTodos }))
    render(<TodoList />)
    const first = screen.getAllByRole('checkbox')[0]
    first.focus()
    fireEvent.keyDown(first, { key: 'Backspace' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ onSettled: expect.any(Function) }),
    )
    vi.useRealTimers()
  })
})
