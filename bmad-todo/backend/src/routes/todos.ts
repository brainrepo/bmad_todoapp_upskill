import type { FastifyInstance } from 'fastify'
import {
  createTodoBodySchema,
  todoResponseSchema,
  errorResponseSchema,
  listTodosResponseSchema,
  patchTodoBodySchema,
  todoIdParamsSchema,
} from '../schemas/todos.js'
import { createTodo, getAllTodos, toggleTodo, deleteTodo } from '../services/todos.js'

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
        params: todoIdParamsSchema,
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

  server.delete(
    '/api/todos/:id',
    {
      schema: {
        params: todoIdParamsSchema,
        response: {
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number }

      const deleted = deleteTodo(server.db, id)
      if (!deleted) {
        throw server.httpErrors.notFound('Todo not found')
      }

      return reply.status(204).send()
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
