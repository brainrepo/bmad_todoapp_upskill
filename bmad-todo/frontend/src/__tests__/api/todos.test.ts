import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTodo, deleteTodo, getTodos, toggleTodo } from '../../api/todos'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('createTodo API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('sends POST /api/todos with JSON body and returns created todo', async () => {
    const mockTodo = { id: 1, text: 'Buy groceries', completed: false, createdAt: '2026-03-07' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTodo),
    })

    const result = await createTodo('Buy groceries')

    expect(mockFetch).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Buy groceries' }),
    })
    expect(result).toEqual(mockTodo)
  })

  it('throws with server error message on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ statusCode: 400, error: 'Bad Request', message: 'Todo description cannot be empty' }),
    })

    await expect(createTodo('')).rejects.toThrow('Todo description cannot be empty')
  })

  it('throws generic message when server response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(createTodo('test')).rejects.toThrow('Failed to create todo')
  })
})

describe('toggleTodo API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('sends PATCH /api/todos/:id with completed: true and returns updated todo', async () => {
    const mockTodo = { id: 1, text: 'Buy groceries', completed: true, createdAt: '2026-03-07' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTodo),
    })

    const result = await toggleTodo(1, true)

    expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(result).toEqual(mockTodo)
  })

  it('sends PATCH /api/todos/:id with completed: false for uncomplete', async () => {
    const mockTodo = { id: 2, text: 'Walk the dog', completed: false, createdAt: '2026-03-07' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTodo),
    })

    const result = await toggleTodo(2, false)

    expect(mockFetch).toHaveBeenCalledWith('/api/todos/2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false }),
    })
    expect(result).toEqual(mockTodo)
  })

  it('throws with server error message on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ statusCode: 404, error: 'Not Found', message: 'Todo not found' }),
    })

    await expect(toggleTodo(999, true)).rejects.toThrow('Todo not found')
  })

  it('throws generic message when server response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(toggleTodo(1, true)).rejects.toThrow('Failed to update todo')
  })
})

describe('deleteTodo API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('sends DELETE /api/todos/:id with no body and returns void on 204', async () => {
    const mockJson = vi.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: mockJson,
    })

    await deleteTodo(1)

    expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', {
      method: 'DELETE',
    })
    expect(mockJson).not.toHaveBeenCalled()
  })

  it('throws with server error message on 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ statusCode: 404, error: 'Not Found', message: 'Todo not found' }),
    })

    await expect(deleteTodo(999)).rejects.toThrow('Todo not found')
  })

  it('throws generic message when server error response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(deleteTodo(1)).rejects.toThrow('Failed to delete todo')
  })
})

describe('getTodos API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('sends GET /api/todos and returns todo array', async () => {
    const mockTodos = [
      { id: 1, text: 'First', completed: false, createdAt: '2026-03-07' },
      { id: 2, text: 'Second', completed: true, createdAt: '2026-03-07' },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTodos),
    })

    const result = await getTodos()

    expect(mockFetch).toHaveBeenCalledWith('/api/todos')
    expect(result).toEqual(mockTodos)
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    await expect(getTodos()).rejects.toThrow('Failed to fetch todos')
  })
})
