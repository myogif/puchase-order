const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

// Intl inserts a non-breaking space between "Rp" and the number; strip it → "Rp1.000.000"
export function formatCurrency(n) {
  return currencyFormatter.format(Number(n) || 0).replace(/\s/g, '')
}

export function formatDate(iso) {
  if (!iso) return '-'
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso) {
  if (!iso) return '-'
  return dateTimeFormatter.format(new Date(iso))
}

// Local calendar day key (YYYY-MM-DD) — used for "today" and date-range filters
export function toDateKey(iso) {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function isToday(iso) {
  return !!iso && toDateKey(iso) === todayKey()
}

// Inclusive range on local day keys; empty bound = open
export function inDateRange(iso, from, to) {
  const key = toDateKey(iso)
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}
