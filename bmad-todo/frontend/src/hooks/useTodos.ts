import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../constants'
import { createTodo, deleteTodo, getTodos, toggleTodo } from '../api/todos'
import type { Todo } from '../types'

type TodoListSnapshot = Todo[] | undefined

export type CreateTodoContext = {
  previous: TodoListSnapshot
  optimisticId: number
}

export type ToggleDeleteMutationContext = {
  previous: TodoListSnapshot
}

type ToggleVariables = { id: number; completed: boolean }

export function useTodos() {
  const { data: todos = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.TODOS,
    queryFn: getTodos,
  })
  return { todos, isLoading, isError, isFetching, refetch }
}

export function useCreateTodo(onError?: (message: string) => void) {
  const queryClient = useQueryClient()

  return useMutation<Todo, Error, string, CreateTodoContext>({
    mutationFn: (text: string) => createTodo(text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TODOS })
      const previous = queryClient.getQueryData<Todo[]>(QUERY_KEYS.TODOS)

      const optimisticTodo: Todo = {
        id: -Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Todo[]>(QUERY_KEYS.TODOS, (old) => [
        ...(old ?? []),
        optimisticTodo,
      ])

      return { previous, optimisticId: optimisticTodo.id }
    },
    onSuccess: (serverTodo, _text, context) => {
      const optimisticId = context?.optimisticId
      if (optimisticId === undefined) return
      queryClient.setQueryData<Todo[]>(QUERY_KEYS.TODOS, (old) => {
        if (!old) return [serverTodo]
        return old.map((t) => (t.id === optimisticId ? serverTodo : t))
      })
    },
    onError: (_err, _text, context) => {
      queryClient.setQueryData(QUERY_KEYS.TODOS, context?.previous ?? [])
      onError?.('Task not saved — try again')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}

export function useToggleTodo(onError?: (message: string) => void) {
  const queryClient = useQueryClient()

  return useMutation<Todo, Error, ToggleVariables, ToggleDeleteMutationContext>({
    mutationFn: ({ id, completed }) => toggleTodo(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TODOS })
      const previous = queryClient.getQueryData<Todo[]>(QUERY_KEYS.TODOS)
      queryClient.setQueryData<Todo[]>(QUERY_KEYS.TODOS, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, completed } : t)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(QUERY_KEYS.TODOS, context?.previous ?? [])
      onError?.('Update failed — try again')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}

export function useDeleteTodo(onError?: (message: string) => void) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number, ToggleDeleteMutationContext>({
    mutationFn: (id: number) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TODOS })
      const previous = queryClient.getQueryData<Todo[]>(QUERY_KEYS.TODOS)
      queryClient.setQueryData<Todo[]>(QUERY_KEYS.TODOS, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(QUERY_KEYS.TODOS, context?.previous ?? [])
      onError?.('Couldn\'t delete — try again')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}
