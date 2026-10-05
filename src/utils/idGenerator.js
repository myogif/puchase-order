export function generateId(prefix, existingItems) {
  const max = existingItems.reduce((acc, item) => {
    const match = /-(\d+)$/.exec(item.id ?? '')
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
