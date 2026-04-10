import { useErrorNotification } from '../hooks/useErrorNotification'
import { AppHeader } from './AppHeader'
import { ErrorNotification } from './ErrorNotification'
import { TodoInput } from './TodoInput'
import { TodoList } from './TodoList'

export function App() {
  const { errorMessage, notify } = useErrorNotification()

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <main className="mx-auto max-w-[640px] px-4 sm:px-12 py-16">
        <AppHeader />
        <TodoInput onError={notify} />
        <div className="mt-6">
          <TodoList onError={notify} />
        </div>
      </main>
      <ErrorNotification message={errorMessage} />
    </div>
  )
}
