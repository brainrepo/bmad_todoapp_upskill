import { useDeleteTodo, useTodos, useToggleTodo } from '../hooks/useTodos'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  onError?: (message: string) => void
}

export function TodoList({ onError }: TodoListProps) {
  const { todos, isLoading, isError, isFetching, refetch } = useTodos()
  const toggleTodo = useToggleTodo(onError)
  const deleteTodo = useDeleteTodo(onError)

  if (isLoading) return <LoadingState />
  if (isError && isFetching) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />
  if (todos.length === 0) return <EmptyState />

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
