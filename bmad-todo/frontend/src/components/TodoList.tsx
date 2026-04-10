import { useDeleteTodo, useTodos, useToggleTodo } from '../hooks/useTodos'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const { todos, isLoading, isError } = useTodos()
  const toggleTodo = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  if (isLoading) return null
  if (isError) return null
  if (todos.length === 0) return null

  const handleToggle = (id: number, completed: boolean) => {
    toggleTodo.mutate({ id, completed })
  }

  const handleDelete = (id: number) => {
    deleteTodo.mutate(id)
  }

  return (
    <ul role="list" aria-label="Task list" className="divide-y divide-border">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
      ))}
    </ul>
  )
}
