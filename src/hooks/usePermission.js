import { getCurrentUser } from '../services/storageService'
import { hasPermission } from '../utils/permissions'

export function usePermission(permission) {
  return hasPermission(getCurrentUser()?.role, permission)
}
