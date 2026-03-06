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
    // Mark second todo as completed directly via DB (no toggle endpoint yet)
    await server.ready()
    server.db.prepare("UPDATE todos SET completed = 1 WHERE text = 'Done'").run()

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
