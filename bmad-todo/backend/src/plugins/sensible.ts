import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifySensible from '@fastify/sensible'

async function sensiblePlugin(server: FastifyInstance) {
  await server.register(fastifySensible)
}

export default fp(sensiblePlugin, { name: 'sensible' })
