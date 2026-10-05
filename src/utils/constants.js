export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
})

export const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
})

export const STOCK_MOVEMENT_TYPE = Object.freeze({
  IN: 'IN',
  OUT: 'OUT',
})

export const AUDIT_ACTIONS = Object.freeze({
  LOGIN: 'LOGIN',
  CREATE_ORDER: 'CREATE_ORDER',
  ACCEPT_ORDER: 'ACCEPT_ORDER',
  CREATE_PAYMENT: 'CREATE_PAYMENT',
  STOCK_IN: 'STOCK_IN',
  GATE_COMPLETED: 'GATE_COMPLETED',
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DEACTIVATE_CUSTOMER: 'DEACTIVATE_CUSTOMER',
})

export const PRODUCT_CATEGORIES = Object.freeze(['Roti', 'Kue', 'Donat', 'Pastry'])

export const ORDER_STATUS_VARIANT = Object.freeze({
  PENDING: 'warning',
  ACCEPTED: 'info',
  PAID: 'success',
  COMPLETED: 'neutral',
})

export const PAYMENT_STATUS_VARIANT = Object.freeze({
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'success',
})

export const ROLE_LABELS = Object.freeze({
  manager: 'Manager',
  cashier: 'Kasir',
  admin: 'Admin',
})

export const ROLE_VARIANTS = Object.freeze({
  manager: 'info',
  cashier: 'success',
  admin: 'warning',
})

export const PAGE_SIZE = 10
