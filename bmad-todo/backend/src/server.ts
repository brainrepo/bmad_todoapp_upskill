import Fastify from 'fastify'

export function buildServer() {
  const server = Fastify({
    logger: true,
  })

  return server
}
