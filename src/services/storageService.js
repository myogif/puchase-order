// Generic localStorage-backed collection seeded from a JSON file on first access.
export function createStore(storageKey, initialData) {
  function getAll() {
    const stored = localStorage.getItem(storageKey)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(storageKey, JSON.stringify(initialData))
    return structuredClone(initialData)
  }

  function save(data) {
    localStorage.setItem(storageKey, JSON.stringify(data))
  }

  return { getAll, save }
}

export function getCurrentUser() {
  const stored = localStorage.getItem('auth_user')
  return stored ? JSON.parse(stored) : null
}
