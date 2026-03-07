import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateTodo, useTodos } from '../../hooks/useTodos'

const mockCreateTodo = vi.fn()
const mockGetTodos = vi.fn()
vi.mock('../../api/todos', () => ({
  createTodo: (...args: unknown[]) => mockCreateTodo(...args),
  getTodos: () => mockGetTodos(),
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
      expect(mockCreateTodo).toHaveBeenCalledWith('Test', expect.anything())
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
})
