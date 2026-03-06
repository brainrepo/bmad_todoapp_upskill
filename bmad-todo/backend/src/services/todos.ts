import type BetterSqlite3 from 'better-sqlite3'
import type { Todo, TodoRow } from '../types.js'

function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  }
}

export function createTodo(db: BetterSqlite3.Database, text: string): Todo {
  const row = db
    .prepare('INSERT INTO todos (text) VALUES (?) RETURNING id, text, completed, created_at')
    .get(text) as TodoRow

  return mapTodoRow(row)
}

export function getAllTodos(db: BetterSqlite3.Database): Todo[] {
  const rows = db
    .prepare('SELECT id, text, completed, created_at FROM todos ORDER BY created_at ASC')
    .all() as TodoRow[]

  return rows.map(mapTodoRow)
}
