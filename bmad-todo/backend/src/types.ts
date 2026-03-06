import type BetterSqlite3 from 'better-sqlite3'

declare module 'fastify' {
  interface FastifyInstance {
    db: BetterSqlite3.Database
  }
}

export interface TodoRow {
  id: number
  text: string
  completed: number
  created_at: string
}

export interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}
