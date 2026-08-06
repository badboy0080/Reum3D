import type { StateStorage } from 'zustand/middleware'

/** Avoid writing localStorage on every slider tick (main lag source). */
export function createDebouncedStorage(delayMs = 400): StateStorage {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: { name: string; value: string } | null = null

  const flush = () => {
    if (!pending) return
    const { name, value } = pending
    pending = null
    localStorage.setItem(name, value)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush)
  }

  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      pending = { name, value }
      if (timer) clearTimeout(timer)
      timer = setTimeout(flush, delayMs)
    },
    removeItem: (name) => {
      if (timer) clearTimeout(timer)
      pending = null
      localStorage.removeItem(name)
    },
  }
}
