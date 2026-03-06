import type { FastifyInstance } from 'fastify'
import { createTodoBodySchema, createTodoResponseSchema, errorResponseSchema } from '../schemas/todos.js'
import { createTodo } from '../services/todos.js'

export default async function todoRoutes(server: FastifyInstance) {
  server.post(
    '/api/todos',
    {
      schema: {
        body: createTodoBodySchema,
        response: {
          201: createTodoResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { text } = request.body as { text: string }
      const trimmedText = text.trim()

      if (trimmedText === '') {
        throw server.httpErrors.badRequest('Todo description cannot be empty')
      }

      const todo = createTodo(server.db, trimmedText)
      return reply.status(201).send(todo)
    },
  )
}
