import {
  type MouseEvent,
  type KeyboardEvent,
  forwardRef,
} from 'react'
import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  isExiting?: boolean
  tabIndex?: number
  onRowKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
}

export const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(
  function TodoItem (
    {
      todo,
      onToggle,
      onDelete,
      isExiting = false,
      tabIndex = 0,
      onRowKeyDown,
    },
    ref,
  ) {
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

    const handleDeleteKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        e.stopPropagation()
        onDelete(todo.id)
      }
    }

    return (
      <li className="group relative min-h-[44px]">
        <div
          ref={ref}
          role="checkbox"
          aria-checked={todo.completed}
          tabIndex={tabIndex}
          onClick={handleClick}
          onKeyDown={onRowKeyDown}
          className={`flex min-h-[44px] flex-col pl-5 pr-14 py-4 border-l-2 border-transparent lg:hover:border-border lg:hover:bg-surface-hover active:bg-surface-hover cursor-pointer select-none transition-colors duration-300 transition-opacity duration-200 motion-reduce:transition-none outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg ${
            isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span
            className={`text-[1.125rem] font-light transition-colors duration-300 motion-reduce:transition-none ${
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
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Delete task: ${todo.text}`}
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-text-secondary text-lg hover:text-text-primary cursor-pointer transition-opacity duration-200 motion-reduce:transition-none outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        >
          ×
        </button>
      </li>
    )
  },
)
