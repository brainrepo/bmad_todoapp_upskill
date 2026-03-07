import { TodoInput } from './TodoInput'

export function App() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <main className="mx-auto max-w-[640px] px-12 py-16">
        <header className="mb-6">
          <h1 className="text-3xl font-extralight tracking-[0.04em] text-text-primary">
            things to do
          </h1>
          <p className="text-[0.8125rem] font-normal uppercase tracking-[0.1em] text-text-placeholder mt-1">
            a simple list
          </p>
        </header>
        <TodoInput />
      </main>
    </div>
  )
}
