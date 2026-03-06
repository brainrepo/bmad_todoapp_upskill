import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'

async function corsPlugin(server: FastifyInstance) {
  await server.register(fastifyCors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
  })
}

export default fp(corsPlugin, { name: 'cors' })
