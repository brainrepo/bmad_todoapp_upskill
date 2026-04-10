import { useEffect, useRef, useState } from 'react'
import { useDeleteTodo, useTodos, useToggleTodo } from '../hooks/useTodos'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  onError?: (message: string) => void
}

const DELETE_FADE_MS = 200

export function TodoList({ onError }: TodoListProps) {
  const { todos, isLoading, isError, isFetching, refetch } = useTodos()
  const toggleTodo = useToggleTodo(onError)
  const deleteTodo = useDeleteTodo(onError)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDeleteIdRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    }
  }, [])

  if (isLoading) return <LoadingState />
  if (isError && isFetching) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />
  if (todos.length === 0) return <EmptyState />

  const handleToggle = (id: number, completed: boolean) => {
    toggleTodo.mutate({ id, completed })
  }

  const handleDelete = (id: number) => {
    if (
      deleteTimerRef.current !== null &&
      pendingDeleteIdRef.current !== null &&
      pendingDeleteIdRef.current !== id
    ) {
      const flushedId = pendingDeleteIdRef.current
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
      pendingDeleteIdRef.current = null
      deleteTodo.mutate(flushedId)
    } else if (deleteTimerRef.current !== null) {
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
      pendingDeleteIdRef.current = null
    }

    pendingDeleteIdRef.current = id
    setDeletingId(id)
    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null
      pendingDeleteIdRef.current = null
      deleteTodo.mutate(id, {
        onSettled: () => {
          setDeletingId((current) => (current === id ? null : current))
        },
      })
    }, DELETE_FADE_MS)
  }

  return (
    <ul role="list" aria-label="Task list" className="divide-y divide-border">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
          isExiting={deletingId === todo.id}
        />
      ))}
    </ul>
  )
}
