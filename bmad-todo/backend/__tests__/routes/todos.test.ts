import { describe, it, expect, afterAll } from 'vitest'
import { buildServer } from '../../src/server.js'

describe('POST /api/todos', () => {
  const server = buildServer({ logger: false })

  afterAll(async () => {
    await server.close()
  })

  it('creates a todo with valid text and returns 201', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Buy groceries' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    const body = response.json()
    expect(body).toMatchObject({
      text: 'Buy groceries',
      completed: false,
    })
    expect(body.id).toBeDefined()
    expect(body.createdAt).toBeDefined()
  })

  it('returns 400 for empty text', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: '' },
    })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Todo description cannot be empty',
    })
  })

  it('returns 400 for whitespace-only text', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: '   ' },
    })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Todo description cannot be empty',
    })
  })

  it('returns 400 for missing text field', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.statusCode).toBe(400)
  })

  it('defaults completed to false', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Check completed default' },
    })

    const body = response.json()
    expect(body.completed).toBe(false)
    expect(typeof body.completed).toBe('boolean')
  })

  it('auto-generates createdAt timestamp', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Check timestamp' },
    })

    const body = response.json()
    expect(body.createdAt).toBeDefined()
    expect(body.createdAt.length).toBeGreaterThan(0)
  })

  it('generates unique sequential IDs for multiple creates', async () => {
    const res1 = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'First' },
    })
    const res2 = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Second' },
    })

    const id1 = res1.json().id
    const id2 = res2.json().id
    expect(id2).toBeGreaterThan(id1)
  })
})

describe('GET /api/todos', () => {
  it('returns 200 with empty array when no todos exist', async () => {
    const server = buildServer({ logger: false })

    const response = await server.inject({
      method: 'GET',
      url: '/api/todos',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
    await server.close()
  })

  it('returns 200 with array of todos when populated', async () => {
    const server = buildServer({ logger: false })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'First' } })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Second' } })

    const response = await server.inject({ method: 'GET', url: '/api/todos' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    const todos = response.json()
    expect(todos).toHaveLength(2)
    await server.close()
  })

  it('returns camelCase fields, not snake_case', async () => {
    const server = buildServer({ logger: false })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Test' } })

    const response = await server.inject({ method: 'GET', url: '/api/todos' })
    const todo = response.json()[0]

    expect(todo).toHaveProperty('id')
    expect(todo).toHaveProperty('text')
    expect(todo).toHaveProperty('completed')
    expect(todo).toHaveProperty('createdAt')
    expect(todo).not.toHaveProperty('created_at')
    await server.close()
  })

  it('returns completed as boolean, not integer', async () => {
    const server = buildServer({ logger: false })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Test' } })

    const response = await server.inject({ method: 'GET', url: '/api/todos' })
    const todo = response.json()[0]

    expect(todo.completed).toBe(false)
    expect(typeof todo.completed).toBe('boolean')
    await server.close()
  })

  it('returns todos ordered by created_at ascending', async () => {
    const server = buildServer({ logger: false })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'First' } })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Second' } })

    const response = await server.inject({ method: 'GET', url: '/api/todos' })
    const todos = response.json()

    expect(todos[0].text).toBe('First')
    expect(todos[1].text).toBe('Second')
    await server.close()
  })

  it('returns all todos regardless of completed status', async () => {
    const server = buildServer({ logger: false })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Active' } })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Done' } })
    // Mark second todo as completed via PATCH endpoint
    const doneTodo = (await server.inject({ method: 'GET', url: '/api/todos' })).json()
      .find((t: { text: string }) => t.text === 'Done')
    await server.inject({
      method: 'PATCH',
      url: `/api/todos/${doneTodo.id}`,
      payload: { completed: true },
    })

    const response = await server.inject({ method: 'GET', url: '/api/todos' })
    const todos = response.json()

    expect(todos).toHaveLength(2)
    const completedTodo = todos.find((t: { completed: boolean }) => t.completed === true)
    const activeTodo = todos.find((t: { completed: boolean }) => t.completed === false)
    expect(completedTodo).toBeDefined()
    expect(activeTodo).toBeDefined()
    await server.close()
  })
})

describe('PATCH /api/todos/:id', () => {
  const server = buildServer({ logger: false })

  afterAll(async () => {
    await server.close()
  })

  it('returns 200 with updated todo when marking as completed', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Complete me' },
    })
    const { id } = createRes.json()

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: true },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    const body = response.json()
    expect(body).toMatchObject({
      id,
      text: 'Complete me',
      completed: true,
    })
    expect(body.createdAt).toBeDefined()
  })

  it('returns 200 with updated todo when reverting to active', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Revert me' },
    })
    const { id } = createRes.json()

    // Mark completed first
    await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: true },
    })

    // Revert to active
    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: false },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.completed).toBe(false)
  })

  it('returns 404 with error contract for non-existent ID', async () => {
    const response = await server.inject({
      method: 'PATCH',
      url: '/api/todos/999999',
      payload: { completed: true },
    })

    expect(response.statusCode).toBe(404)
    const body = response.json()
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Todo not found',
    })
  })

  it('returns camelCase fields, not snake_case', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'CamelCase route test' },
    })
    const { id } = createRes.json()

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: true },
    })

    const body = response.json()
    expect(body).toHaveProperty('createdAt')
    expect(body).not.toHaveProperty('created_at')
  })

  it('returns completed as boolean, not integer', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Boolean route test' },
    })
    const { id } = createRes.json()

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: true },
    })

    const body = response.json()
    expect(body.completed).toBe(true)
    expect(typeof body.completed).toBe('boolean')
  })

  it('ignores additional properties in body (text cannot be modified via PATCH)', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Original text' },
    })
    const { id } = createRes.json()

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: true, text: 'sneaky edit' },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.text).toBe('Original text')
    expect(body.completed).toBe(true)
  })

  it('returns 400 for missing completed field', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Missing field test' },
    })
    const { id } = createRes.json()

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: {},
    })

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 for non-boolean completed value', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Type check test' },
    })
    const { id } = createRes.json()

    const response = await server.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: 'yes' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 for non-integer id parameter', async () => {
    const response = await server.inject({
      method: 'PATCH',
      url: '/api/todos/abc',
      payload: { completed: true },
    })

    expect(response.statusCode).toBe(400)
  })
})
