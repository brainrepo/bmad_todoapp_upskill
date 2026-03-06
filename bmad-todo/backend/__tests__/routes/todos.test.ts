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
