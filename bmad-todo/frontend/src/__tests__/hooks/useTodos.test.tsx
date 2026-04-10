import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateTodo, useDeleteTodo, useTodos, useToggleTodo } from '../../hooks/useTodos'
import type { Todo } from '../../types'

const mockCreateTodo = vi.fn()
const mockDeleteTodo = vi.fn()
const mockGetTodos = vi.fn()
const mockToggleTodo = vi.fn()
vi.mock('../../api/todos', () => ({
  createTodo: (...args: unknown[]) => mockCreateTodo(...args),
  deleteTodo: (...args: unknown[]) => mockDeleteTodo(...args),
  getTodos: () => mockGetTodos(),
  toggleTodo: (...args: unknown[]) => mockToggleTodo(...args),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useTodos', () => {
  beforeEach(() => {
    mockGetTodos.mockReset()
  })

  it('returns todos from API', async () => {
    const mockTodos = [
      { id: 1, text: 'First', completed: false, createdAt: '2026-03-07' },
      { id: 2, text: 'Second', completed: true, createdAt: '2026-03-07' },
    ]
    mockGetTodos.mockResolvedValueOnce(mockTodos)

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('defaults to empty array when no data', async () => {
    mockGetTodos.mockResolvedValueOnce([])

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.todos).toEqual([])
  })

  it('sets isError on fetch failure', async () => {
    mockGetTodos.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('isFetching is true while refetching after error', async () => {
    mockGetTodos.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    let resolveRefetch: (value: Todo[]) => void
    mockGetTodos.mockImplementationOnce(
      () =>
        new Promise<Todo[]>((resolve) => {
          resolveRefetch = resolve
        }),
    )

    act(() => {
      void result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(true)
    })

    await act(async () => {
      resolveRefetch([])
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })
})

describe('useCreateTodo', () => {
  beforeEach(() => {
    mockCreateTodo.mockReset()
  })

  it('calls createTodo API with text', async () => {
    const mockTodo = { id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }
    mockCreateTodo.mockResolvedValueOnce(mockTodo)

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('Test')
    })

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith('Test')
    })
  })

  it('adds optimistic todo to cache while mutation is in-flight', async () => {
    let resolveMutation!: (value: unknown) => void
    mockCreateTodo.mockReturnValueOnce(
      new Promise((resolve) => { resolveMutation = resolve }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useCreateTodo(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate('Optimistic test')
      // Allow microtasks (onMutate) to flush
      await new Promise((r) => setTimeout(r, 0))
    })

    // Cache should contain optimistic todo BEFORE mutation resolves
    const cached = queryClient.getQueryData<Array<{ text: string }>>(['todos'])
    expect(cached).toHaveLength(1)
    expect(cached![0].text).toBe('Optimistic test')

    // Clean up: resolve the pending mutation
    await act(async () => {
      resolveMutation({ id: 1, text: 'Optimistic test', completed: false, createdAt: '2026-03-07' })
    })
  })

  it('rolls back cache on mutation error', async () => {
    mockCreateTodo.mockRejectedValueOnce(new Error('Network error'))

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const originalTodos = [{ id: 1, text: 'Existing', completed: false, createdAt: '2026-03-07' }]
    queryClient.setQueryData(['todos'], originalTodos)

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useCreateTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('Will fail')
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // After error, cache should be rolled back to original
    await waitFor(() => {
      const cached = queryClient.getQueryData<unknown[]>(['todos'])
      expect(cached).toEqual(originalTodos)
    })
  })

  it('calls onError with user message when create fails', async () => {
    const onError = vi.fn()
    mockCreateTodo.mockRejectedValueOnce(new Error('Network error'))

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useCreateTodo(onError), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('Will fail')
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('Task not saved — try again')
  })

  it('replaces optimistic temp id with server todo on success', async () => {
    const serverTodo = { id: 42, text: 'Server', completed: false, createdAt: '2026-03-07' }
    mockCreateTodo.mockResolvedValueOnce(serverTodo)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useCreateTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('Server')
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(['todos'])
      expect(cached).toHaveLength(1)
      expect(cached![0].id).toBe(42)
      expect(cached![0].text).toBe('Server')
    })
  })
})

describe('useToggleTodo', () => {
  beforeEach(() => {
    mockToggleTodo.mockReset()
  })

  it('optimistically flips completed in cache before mutation resolves', async () => {
    let resolvePatch!: (value: Todo) => void
    mockToggleTodo.mockReturnValueOnce(
      new Promise<Todo>((resolve) => {
        resolvePatch = resolve
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ id: 1, completed: true })
      await Promise.resolve()
    })

    const mid = queryClient.getQueryData<Todo[]>(['todos'])
    expect(mid).toHaveLength(1)
    expect(mid![0].completed).toBe(true)

    await act(async () => {
      resolvePatch({ id: 1, text: 'Test', completed: true, createdAt: '2026-03-07' })
    })
  })

  it('calls toggleTodo API with id and completed', async () => {
    const mockTodo = { id: 1, text: 'Test', completed: true, createdAt: '2026-03-07' }
    mockToggleTodo.mockResolvedValueOnce(mockTodo)

    const { result } = renderHook(() => useToggleTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 1, completed: true })
    })

    await waitFor(() => {
      expect(mockToggleTodo).toHaveBeenCalledWith(1, true)
    })
  })

  it('invalidates todos query on settled after success', async () => {
    const mockTodo = { id: 1, text: 'Test', completed: true, createdAt: '2026-03-07' }
    mockToggleTodo.mockResolvedValueOnce(mockTodo)
    mockGetTodos.mockResolvedValue([mockTodo])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ id: 1, completed: true })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // After settled, the query should be invalidated (triggers refetch)
    await waitFor(() => {
      const state = queryClient.getQueryState(['todos'])
      expect(state?.isInvalidated).toBe(true)
    })
  })

  it('invalidates todos query on settled after error', async () => {
    mockToggleTodo.mockRejectedValueOnce(new Error('Network error'))
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ id: 1, completed: true })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // After settled (even on error), the query should be invalidated
    await waitFor(() => {
      const state = queryClient.getQueryState(['todos'])
      expect(state?.isInvalidated).toBe(true)
    })
  })

  it('calls onError with user message when toggle fails', async () => {
    const onError = vi.fn()
    mockToggleTodo.mockRejectedValueOnce(new Error('Network error'))
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useToggleTodo(onError), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ id: 1, completed: true })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('Update failed — try again')
  })

  it('restores previous cache when toggle fails', async () => {
    mockToggleTodo.mockRejectedValueOnce(new Error('Network error'))
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const before = [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }]
    queryClient.setQueryData(['todos'], before)

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ id: 1, completed: true })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(queryClient.getQueryData<Todo[]>(['todos'])).toEqual(before)
  })
})

describe('useDeleteTodo', () => {
  beforeEach(() => {
    mockDeleteTodo.mockReset()
  })

  it('optimistically removes todo from cache before mutation resolves', async () => {
    let resolveDelete!: () => void
    mockDeleteTodo.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveDelete = resolve
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate(1)
      await Promise.resolve()
    })

    expect(queryClient.getQueryData<Todo[]>(['todos'])).toEqual([])

    await act(async () => {
      resolveDelete()
    })
  })

  it('calls deleteTodo API with id', async () => {
    mockDeleteTodo.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(mockDeleteTodo).toHaveBeenCalledWith(1)
    })
  })

  it('invalidates todos query on settled after success', async () => {
    mockDeleteTodo.mockResolvedValueOnce(undefined)
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      const state = queryClient.getQueryState(['todos'])
      expect(state?.isInvalidated).toBe(true)
    })
  })

  it('invalidates todos query on settled after error', async () => {
    mockDeleteTodo.mockRejectedValueOnce(new Error('Network error'))
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    await waitFor(() => {
      const state = queryClient.getQueryState(['todos'])
      expect(state?.isInvalidated).toBe(true)
    })
  })

  it('calls onError with user message when delete fails', async () => {
    const onError = vi.fn()
    mockDeleteTodo.mockRejectedValueOnce(new Error('Network error'))
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['todos'], [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useDeleteTodo(onError), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('Couldn\'t delete — try again')
  })

  it('restores previous cache when delete fails', async () => {
    mockDeleteTodo.mockRejectedValueOnce(new Error('Network error'))
    mockGetTodos.mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const before = [{ id: 1, text: 'Test', completed: false, createdAt: '2026-03-07' }]
    queryClient.setQueryData(['todos'], before)

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(queryClient.getQueryData<Todo[]>(['todos'])).toEqual(before)
  })
})
