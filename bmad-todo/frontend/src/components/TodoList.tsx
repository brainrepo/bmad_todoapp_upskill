import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type KeyboardEvent,
} from 'react'
import { useDeleteTodo, useTodos, useToggleTodo } from '../hooks/useTodos'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  onError?: (message: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
}

const DELETE_FADE_MS = 200

function getDeleteFadeDelayMs () {
  if (typeof window === 'undefined') return DELETE_FADE_MS
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : DELETE_FADE_MS
}

export function TodoList ({ onError, inputRef }: TodoListProps) {
  const { todos, isLoading, isError, isFetching, refetch } = useTodos()
  const toggleTodo = useToggleTodo(onError)
  const deleteTodo = useDeleteTodo(onError)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDeleteIdRef = useRef<number | null>(null)
  const [rovingIndex, setRovingIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevTodosLengthRef = useRef(0)
  const todoIdsKey = todos.map((t) => t.id).join(',')

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    }
  }, [])

  useLayoutEffect(() => {
    if (todos.length === 0) {
      prevTodosLengthRef.current = 0
      return
    }
    const prevLen = prevTodosLengthRef.current
    const shrink = todos.length < prevLen
    prevTodosLengthRef.current = todos.length

    setRovingIndex((i) => {
      const next = Math.min(i, todos.length - 1)
      if (shrink) {
        queueMicrotask(() => {
          itemRefs.current[next]?.focus()
        })
      }
      return next
    })
  }, [todos.length, todoIdsKey])

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
    const delayMs = getDeleteFadeDelayMs()
    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null
      pendingDeleteIdRef.current = null
      deleteTodo.mutate(id, {
        onSettled: () => {
          setDeletingId((current) => (current === id ? null : current))
        },
      })
    }, delayMs)
  }

  const focusItem = (index: number) => {
    setRovingIndex(index)
    queueMicrotask(() => {
      itemRefs.current[index]?.focus()
    })
  }

  const handleRowKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (index < todos.length - 1) focusItem(index + 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index > 0) {
        focusItem(index - 1)
      } else {
        inputRef?.current?.focus()
      }
      return
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const todo = todos[index]
      handleToggle(todo.id, !todo.completed)
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      handleDelete(todos[index].id)
    }
  }

  if (isLoading || (isError && isFetching)) {
    return (
      <ul
        role="list"
        aria-label="Task list"
        aria-live="polite"
        aria-busy={true}
        className="list-none divide-y divide-border"
      >
        <li className="py-12 text-center">
          <LoadingState />
        </li>
      </ul>
    )
  }
  if (isError) return <ErrorState onRetry={refetch} />
  if (todos.length === 0) return <EmptyState />

  return (
    <ul role="list" aria-label="Task list" className="divide-y divide-border">
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
          isExiting={deletingId === todo.id}
          tabIndex={index === rovingIndex ? 0 : -1}
          onRowKeyDown={(e) => handleRowKeyDown(e, index)}
        />
      ))}
    </ul>
  )
}
