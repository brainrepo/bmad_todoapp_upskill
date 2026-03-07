import { useTodos } from '../hooks/useTodos'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const { todos, isLoading, isError } = useTodos()

  if (isLoading) return null
  if (isError) return null
  if (todos.length === 0) return null

  return (
    <ul role="list" aria-label="Task list" className="divide-y divide-border">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
