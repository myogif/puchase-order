export const ROLE_PERMISSIONS = {
  manager: ['dashboard', 'orders', 'preorders', 'pos', 'gate', 'products', 'customers', 'inventory', 'stockMovements', 'payments', 'reports', 'auditLogs', 'users'],
  cashier: ['dashboard', 'orders', 'pos', 'gate', 'customers', 'products'],
  admin: ['products', 'customers', 'inventory', 'stockMovements', 'users'],
}

export const PERMISSION_ROUTES = {
  dashboard: '/dashboard',
  orders: '/orders',
  preorders: '/preorders',
  pos: '/pos',
  gate: '/gate',
  products: '/products',
  customers: '/customers',
  inventory: '/inventory',
  stockMovements: '/inventory/movements',
  payments: '/payments',
  reports: '/reports',
  auditLogs: '/audit-logs',
  users: '/users',
}

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getDefaultRoute(role) {
  const first = ROLE_PERMISSIONS[role]?.[0]
  return first ? PERMISSION_ROUTES[first] : '/login'
}
