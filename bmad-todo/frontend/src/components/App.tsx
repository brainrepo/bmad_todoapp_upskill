import { useRef } from 'react'
import { useErrorNotification } from '../hooks/useErrorNotification'
import { AppHeader } from './AppHeader'
import { ErrorNotification } from './ErrorNotification'
import { TodoInput } from './TodoInput'
import { TodoList } from './TodoList'

export function App () {
  const { errorMessage, notify } = useErrorNotification()
  const todoInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <main className="w-full max-w-none sm:max-w-[640px] sm:mx-auto px-4 sm:px-12 py-16">
        <AppHeader />
        <TodoInput ref={todoInputRef} onError={notify} />
        <div className="mt-6">
          <TodoList onError={notify} inputRef={todoInputRef} />
        </div>
      </main>
      <ErrorNotification message={errorMessage} />
    </div>
  )
}
