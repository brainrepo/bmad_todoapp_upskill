import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTodo } from '../../api/todos'

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
