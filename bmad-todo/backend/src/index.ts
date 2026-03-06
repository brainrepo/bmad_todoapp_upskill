import { buildServer } from './server.js'

const server = buildServer()

const start = async () => {
  const port = Number(process.env['PORT'] ?? 3001)
  const host = process.env['HOST'] ?? '0.0.0.0'

  await server.listen({ port, host })
}

start()
