import { AppHeader } from './AppHeader'
import { TodoInput } from './TodoInput'
import { TodoList } from './TodoList'

export function App() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <main className="mx-auto max-w-[640px] px-4 sm:px-12 py-16">
        <AppHeader />
        <TodoInput />
        <div className="mt-6">
          <TodoList />
        </div>
      </main>
    </div>
  )
}
