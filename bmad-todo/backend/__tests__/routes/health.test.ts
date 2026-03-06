import { describe, it, expect } from 'vitest'
import { buildServer } from '../../src/server.js'

describe('Server', () => {
  it('builds a Fastify instance', () => {
    const server = buildServer()
    expect(server).toBeDefined()
  })
})
