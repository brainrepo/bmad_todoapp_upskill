import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildServer } from '../../src/server.js'
import { createTodo } from '../../src/services/todos.js'

describe('TodoService', () => {
  const server = buildServer({ logger: false })

  beforeAll(async () => {
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('creates a todo and returns camelCase mapped result', () => {
    const result = createTodo(server.db, 'Buy groceries')

    expect(result).toMatchObject({
      text: 'Buy groceries',
      completed: false,
    })
    expect(result.id).toBeTypeOf('number')
    expect(result.createdAt).toBeTypeOf('string')
    expect(result).not.toHaveProperty('created_at')
    expect(result).not.toHaveProperty('completed', 0)
  })

  it('maps completed as boolean false, not integer 0', () => {
    const result = createTodo(server.db, 'Test boolean mapping')
    expect(result.completed).toBe(false)
    expect(typeof result.completed).toBe('boolean')
  })

  it('generates unique sequential IDs', () => {
    const todo1 = createTodo(server.db, 'First todo')
    const todo2 = createTodo(server.db, 'Second todo')
    expect(todo2.id).toBeGreaterThan(todo1.id)
  })

  it('auto-generates createdAt timestamp', () => {
    const result = createTodo(server.db, 'Timestamped todo')
    expect(result.createdAt).toBeDefined()
    expect(result.createdAt.length).toBeGreaterThan(0)
  })
})
