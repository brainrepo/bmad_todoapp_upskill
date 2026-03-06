import Fastify, { type FastifyServerOptions } from 'fastify'
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import sensiblePlugin from './plugins/sensible.js'
import databasePlugin from './plugins/database.js'
import healthRoutes from './routes/health.js'

export function buildServer(opts: FastifyServerOptions = {}) {
  const server = Fastify(opts)

  server.register(corsPlugin)
  server.register(helmetPlugin)
  server.register(sensiblePlugin)
  server.register(databasePlugin)

  server.register(healthRoutes)

  return server
}
