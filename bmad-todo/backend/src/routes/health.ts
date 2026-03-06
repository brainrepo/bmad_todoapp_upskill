import type { FastifyInstance } from 'fastify'

export default async function healthRoutes(server: FastifyInstance) {
  server.get('/api/health', async () => {
    return { status: 'ok' }
  })
}
