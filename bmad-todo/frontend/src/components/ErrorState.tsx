interface ErrorStateProps {
  onRetry: () => void
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-light text-text-secondary">Something's not right</h2>
      <button
        type="button"
        onClick={onRetry}
        className="text-sm text-accent hover:underline cursor-pointer mt-2"
      >
        Try again
      </button>
    </div>
  )
}
