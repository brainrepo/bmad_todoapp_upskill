import type BetterSqlite3 from 'better-sqlite3'
import type { Todo, TodoRow } from '../types.js'

export function createTodo(db: BetterSqlite3.Database, text: string): Todo {
  const row = db
    .prepare('INSERT INTO todos (text) VALUES (?) RETURNING *')
    .get(text) as TodoRow

  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  }
}
