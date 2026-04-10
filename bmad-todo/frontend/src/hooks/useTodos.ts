import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../constants'
import { createTodo, deleteTodo, getTodos, toggleTodo } from '../api/todos'
import type { Todo } from '../types'

export function useTodos() {
  const { data: todos = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.TODOS,
    queryFn: getTodos,
  })
  return { todos, isLoading, isError }
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
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

      return { previous }
    },
    onError: (_err, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.TODOS, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}

export function useToggleTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodo(id, completed),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}
