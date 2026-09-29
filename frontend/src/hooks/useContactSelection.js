import { useCallback, useMemo, useState } from 'react'

export const MAX_SELECTION = 5

// Manages which contacts are selected, enforcing a maximum of 5.
// Contacts are identified by their index in the provided list.
export function useContactSelection() {
  const [selectedKeys, setSelectedKeys] = useState(() => new Set())
  const [limitReached, setLimitReached] = useState(false)

  const toggle = useCallback((key) => {
    setLimitReached(false)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        return next
      }
      if (next.size >= MAX_SELECTION) {
        setLimitReached(true)
        return prev
      }
      next.add(key)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSelectedKeys(new Set())
    setLimitReached(false)
  }, [])

  const isSelected = useCallback((key) => selectedKeys.has(key), [selectedKeys])

  const count = selectedKeys.size

  return useMemo(
    () => ({ selectedKeys, count, toggle, clear, isSelected, limitReached }),
    [selectedKeys, count, toggle, clear, isSelected, limitReached]
  )
}
