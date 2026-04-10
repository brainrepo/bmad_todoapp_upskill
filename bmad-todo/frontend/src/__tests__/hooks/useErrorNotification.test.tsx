import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useErrorNotification } from '../../hooks/useErrorNotification'

describe('useErrorNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initially has null errorMessage', () => {
    const { result } = renderHook(() => useErrorNotification())
    expect(result.current.errorMessage).toBeNull()
  })

  it('notify sets errorMessage', () => {
    const { result } = renderHook(() => useErrorNotification())
    act(() => {
      result.current.notify('Task not saved')
    })
    expect(result.current.errorMessage).toBe('Task not saved')
  })

  it('errorMessage clears after 4 seconds', () => {
    const { result } = renderHook(() => useErrorNotification())
    act(() => {
      result.current.notify('Error')
    })
    expect(result.current.errorMessage).toBe('Error')

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current.errorMessage).toBeNull()
  })

  it('new notify replaces previous message (no stacking)', () => {
    const { result } = renderHook(() => useErrorNotification())
    act(() => {
      result.current.notify('First error')
    })
    expect(result.current.errorMessage).toBe('First error')

    act(() => {
      result.current.notify('Second error')
    })
    expect(result.current.errorMessage).toBe('Second error')

    // After 4s from second notify, should clear
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current.errorMessage).toBeNull()
  })

  it('replacement resets the timer', () => {
    const { result } = renderHook(() => useErrorNotification())
    act(() => {
      result.current.notify('First')
    })

    // Advance 3 seconds (not yet expired)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.errorMessage).toBe('First')

    // Replace with new message — timer resets
    act(() => {
      result.current.notify('Second')
    })

    // 3 more seconds — first timer would have expired, but second timer hasn't
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.errorMessage).toBe('Second')

    // 1 more second — second timer expires (4s total from second notify)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.errorMessage).toBeNull()
  })
})
