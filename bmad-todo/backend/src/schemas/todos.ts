export const createTodoBodySchema = {
  type: 'object',
  required: ['text'],
  properties: {
    text: { type: 'string' },
  },
  additionalProperties: false,
} as const

export const createTodoResponseSchema = {
  type: 'object',
  required: ['id', 'text', 'completed', 'createdAt'],
  properties: {
    id: { type: 'integer' },
    text: { type: 'string' },
    completed: { type: 'boolean' },
    createdAt: { type: 'string' },
  },
} as const

export const listTodosResponseSchema = {
  type: 'array',
  items: createTodoResponseSchema,
} as const

export const errorResponseSchema = {
  type: 'object',
  required: ['statusCode', 'error', 'message'],
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const
