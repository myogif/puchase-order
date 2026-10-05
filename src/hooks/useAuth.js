import { useCallback, useState } from 'react'
import { userService } from '../services/userService'
import { auditService } from '../services/auditService'
import { getCurrentUser } from '../services/storageService'
import { AUDIT_ACTIONS } from '../utils/constants'

export function useAuth() {
  const [user, setUser] = useState(getCurrentUser)

  const login = useCallback((username, password) => {
    const found = userService.authenticate(username, password)
    if (!found) return null
    localStorage.setItem('auth_user', JSON.stringify(found))
    setUser(found)
    auditService.log({
      action: AUDIT_ACTIONS.LOGIN,
      referenceType: 'USER',
      referenceId: found.id,
      description: `${found.name} login ke sistem`,
    })
    return found
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  return { user, login, logout, isAuthenticated: !!user }
}
