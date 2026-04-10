import { useState, useRef, useEffect } from 'react'
import { useCreateTodo } from '../hooks/useTodos'

interface TodoInputProps {
  onError?: (message: string) => void
}

export function TodoInput({ onError }: TodoInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createTodo = useCreateTodo(onError)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = text.trim()
      if (!trimmed) return
      createTodo.mutate(trimmed)
      setText('')
    } else if (e.key === 'Escape') {
      setText('')
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="What needs doing?"
      aria-label="Add a new task"
      className="w-full bg-transparent border-l-2 border-accent pl-5 py-4 text-[1.125rem] font-light text-text-primary placeholder:text-text-placeholder outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
    />
  )
}
