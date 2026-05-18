import { useState, useCallback } from 'react'

/** Simple boolean toggle helper for modals, dropdowns, etc. */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  const open    = useCallback(() => setIsOpen(true),  [])
  const close   = useCallback(() => setIsOpen(false), [])
  const toggle  = useCallback(() => setIsOpen((v) => !v), [])
  return { isOpen, open, close, toggle }
}
