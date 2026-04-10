import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useCallback,
} from 'react'
import { useCreateTodo } from '../hooks/useTodos'

function assignRef<T> (el: T | null, ref: React.Ref<T> | undefined) {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(el)
    return
  }
  const refObject = ref as { current: T | null }
  refObject.current = el
}

interface TodoInputProps {
  onError?: (message: string) => void
}

export const TodoInput = forwardRef<HTMLInputElement, TodoInputProps>(
  function TodoInput ({ onError }, ref) {
    const [text, setText] = useState('')
    const localRef = useRef<HTMLInputElement>(null)
    const createTodo = useCreateTodo(onError)

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        localRef.current = node
        assignRef(node, ref)
      },
      [ref],
    )

    useEffect(() => {
      localRef.current?.focus()
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
        ref={setRefs}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs doing?"
        aria-label="Add a new task"
        className="min-h-[44px] w-full box-border bg-transparent border-l-2 border-accent pl-5 py-4 text-[1.125rem] font-light text-text-primary placeholder:text-text-placeholder outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      />
    )
  },
)
