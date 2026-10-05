import initialData from '../data/auditLogs.json'
import { createStore, getCurrentUser } from './storageService'
import { generateId } from '../utils/idGenerator'

const store = createStore('roti_audit_logs', initialData)

function getAll() {
  return store.getAll()
}

function log({ action, referenceType = null, referenceId = null, description = '' }) {
  const logs = store.getAll()
  const user = getCurrentUser()
  const entry = {
    id: generateId('LOG', logs),
    action,
    userId: user?.id ?? null,
    userName: user?.name ?? null,
    referenceType,
    referenceId,
    description,
    createdAt: new Date().toISOString(),
  }
  store.save([...logs, entry])
  return entry
}

export const auditService = { getAll, log }
