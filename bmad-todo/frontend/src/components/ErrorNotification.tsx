interface ErrorNotificationProps {
  message: string | null
}

export function ErrorNotification({ message }: ErrorNotificationProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 bg-surface border-l-2 border-error px-4 py-3 rounded-r transition-opacity duration-200 motion-reduce:transition-none"
    >
      <p className="text-sm text-text-primary">{message}</p>
    </div>
  )
}
