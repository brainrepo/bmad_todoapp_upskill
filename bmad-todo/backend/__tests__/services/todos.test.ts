import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildServer } from '../../src/server.js'
import { createTodo, getAllTodos, toggleTodo } from '../../src/services/todos.js'

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

describe('TodoService - getAllTodos', () => {
  const server = buildServer({ logger: false })

  beforeAll(async () => {
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('returns empty array when no todos exist', () => {
    const result = getAllTodos(server.db)
    expect(result).toEqual([])
  })

  it('returns all todos with camelCase mapping', () => {
    createTodo(server.db, 'First')
    createTodo(server.db, 'Second')

    const result = getAllTodos(server.db)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('createdAt')
    expect(result[0]).not.toHaveProperty('created_at')
    expect(typeof result[0].completed).toBe('boolean')
  })

  it('returns todos ordered by created_at ascending', () => {
    const result = getAllTodos(server.db)
    expect(result[0].text).toBe('First')
    expect(result[1].text).toBe('Second')
  })
})

describe('TodoService - toggleTodo', () => {
  const server = buildServer({ logger: false })

  beforeAll(async () => {
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('updates active todo to completed and returns mapped result', () => {
    const created = createTodo(server.db, 'Toggle me')
    expect(created.completed).toBe(false)

    const toggled = toggleTodo(server.db, created.id, true)
    expect(toggled).not.toBeNull()
    expect(toggled!.id).toBe(created.id)
    expect(toggled!.text).toBe('Toggle me')
    expect(toggled!.completed).toBe(true)
    expect(toggled!.createdAt).toBe(created.createdAt)
  })

  it('updates completed todo back to active', () => {
    const created = createTodo(server.db, 'Toggle back')
    toggleTodo(server.db, created.id, true)

    const reverted = toggleTodo(server.db, created.id, false)
    expect(reverted).not.toBeNull()
    expect(reverted!.completed).toBe(false)
  })

  it('returns null for non-existent ID', () => {
    const result = toggleTodo(server.db, 999999, true)
    expect(result).toBeNull()
  })

  it('returns camelCase fields, not snake_case', () => {
    const created = createTodo(server.db, 'CamelCase test')
    const toggled = toggleTodo(server.db, created.id, true)

    expect(toggled).toHaveProperty('createdAt')
    expect(toggled).not.toHaveProperty('created_at')
  })

  it('returns completed as boolean, not integer', () => {
    const created = createTodo(server.db, 'Boolean test')
    const toggled = toggleTodo(server.db, created.id, true)

    expect(toggled!.completed).toBe(true)
    expect(typeof toggled!.completed).toBe('boolean')
  })
})
