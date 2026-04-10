import type { MouseEvent } from 'react'
import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  isExiting?: boolean
}

export function TodoItem({ todo, onToggle, onDelete, isExiting = false }: TodoItemProps) {
  const formattedDate = new Date(todo.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleClick = () => {
    onToggle(todo.id, !todo.completed)
  }

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onDelete(todo.id)
  }

  return (
    <li
      role="checkbox"
      aria-checked={todo.completed}
      tabIndex={0}
      onClick={handleClick}
      className={`group relative flex flex-col pl-5 pr-14 py-4 border-l-2 border-transparent hover:border-border hover:bg-surface-hover cursor-pointer select-none transition-colors duration-300 transition-opacity duration-200 motion-reduce:transition-none ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <span
        className={`text-[1.125rem] font-light transition-all duration-300 motion-reduce:transition-none ${
          todo.completed
            ? 'text-text-secondary line-through italic'
            : 'text-text-primary'
        }`}
      >
        {todo.text}
      </span>
      <span className="text-[0.6875rem] font-normal uppercase tracking-[0.05em] text-text-placeholder mt-1">
        {formattedDate}
      </span>
      <button
        type="button"
        aria-label={`Delete task: ${todo.text}`}
        onClick={handleDelete}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-text-secondary text-lg hover:text-text-primary cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 motion-reduce:transition-none"
      >
        ×
      </button>
    </li>
  )
}
