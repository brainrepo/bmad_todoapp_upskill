import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const formattedDate = new Date(todo.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <li
      role="checkbox"
      aria-checked={todo.completed}
      className="group flex flex-col px-5 py-4 border-l-2 border-transparent hover:border-border hover:bg-surface-hover transition-all duration-300 motion-reduce:transition-none"
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
    </li>
  )
}
