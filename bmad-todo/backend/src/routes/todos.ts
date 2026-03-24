import type { FastifyInstance } from 'fastify'
import {
  createTodoBodySchema,
  todoResponseSchema,
  errorResponseSchema,
  listTodosResponseSchema,
  patchTodoBodySchema,
  patchTodoParamsSchema,
} from '../schemas/todos.js'
import { createTodo, getAllTodos, toggleTodo } from '../services/todos.js'

export default async function todoRoutes(server: FastifyInstance) {
  server.post(
    '/api/todos',
    {
      schema: {
        body: createTodoBodySchema,
        response: {
          201: todoResponseSchema,
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

  server.patch(
    '/api/todos/:id',
    {
      schema: {
        params: patchTodoParamsSchema,
        body: patchTodoBodySchema,
        response: {
          200: todoResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params as { id: number }
      const { completed } = request.body as { completed: boolean }

      const todo = toggleTodo(server.db, id, completed)
      if (!todo) {
        throw server.httpErrors.notFound('Todo not found')
      }

      return todo
    },
  )

  server.get(
    '/api/todos',
    {
      schema: {
        response: {
          200: listTodosResponseSchema,
        },
      },
    },
    async () => {
      return getAllTodos(server.db)
    },
  )
}
