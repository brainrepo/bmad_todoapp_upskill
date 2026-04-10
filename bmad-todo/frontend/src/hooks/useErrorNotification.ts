import { useState, useRef, useCallback, useEffect } from 'react'

export function useErrorNotification() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setErrorMessage(message)
    timerRef.current = setTimeout(() => setErrorMessage(null), 4000)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { errorMessage, notify }
}
