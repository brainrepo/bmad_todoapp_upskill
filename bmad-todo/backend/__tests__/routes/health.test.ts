import { describe, it, expect, afterAll } from 'vitest'
import { buildServer } from '../../src/server.js'

describe('GET /api/health', () => {
  const server = buildServer({ logger: false })

  afterAll(async () => {
    await server.close()
  })

  it('returns 200 with status ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
