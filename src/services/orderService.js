import initialData from '../data/orders.json'
import { createStore, getCurrentUser } from './storageService'
import { generateId } from '../utils/idGenerator'
import { auditService } from './auditService'
import { productService } from './productService'
import { customerService } from './customerService'
import { AUDIT_ACTIONS, ORDER_STATUS, PAYMENT_STATUS } from '../utils/constants'
import { formatCurrency } from '../utils/format'

const store = createStore('roti_orders', initialData)

function getAll() {
  return store.getAll()
}

function getById(id) {
  return store.getAll().find(o => o.id === id) ?? null
}

function update(id, updates) {
  const orders = store.getAll()
  const existing = orders.find(o => o.id === id)
  if (!existing) return null
  const order = { ...existing, ...updates }
  store.save(orders.map(o => (o.id === id ? order : o)))
  return order
}

// Items whose requested quantity exceeds current stock: [{ productId, productName, requested, available }]
function findInsufficientItems(items) {
  return items.flatMap(item => {
    const product = productService.getById(item.productId)
    const available = product?.stock ?? 0
    return item.quantity > available
      ? [{ productId: item.productId, productName: product?.name ?? item.productName, requested: item.quantity, available }]
      : []
  })
}

/**
 * orderData: { customerId, items: [{ productId, quantity }], discount }
 * options.forcePreOrder: create as PENDING despite insufficient stock.
 * Never touches stock — deduction happens on first payment.
 */
function create(orderData, { forcePreOrder = false } = {}) {
  const customer = customerService.getById(orderData.customerId)
  if (!customer) return { success: false, error: 'Pelanggan wajib dipilih' }
  if (!orderData.items?.length) return { success: false, error: 'Minimal 1 item' }
  if (orderData.items.some(i => !(Number(i.quantity) > 0))) {
    return { success: false, error: 'Jumlah item harus lebih dari 0' }
  }

  const items = []
  for (const raw of orderData.items) {
    const product = productService.getById(raw.productId)
    if (!product) return { success: false, error: `Produk ${raw.productId} tidak ditemukan` }
    const quantity = Number(raw.quantity)
    items.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity,
    })
  }

  const insufficientItems = findInsufficientItems(items)
  if (insufficientItems.length && !forcePreOrder) {
    return { success: false, preOrderRequired: true, insufficientItems }
  }

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)
  const discount = Math.min(Math.max(Number(orderData.discount) || 0, 0), subtotal)
  const total = subtotal - discount
  const orders = store.getAll()
  const order = {
    id: generateId('ORD', orders),
    customerId: customer.id,
    customerName: customer.name,
    items,
    subtotal,
    discount,
    total,
    paidAmount: 0,
    remainingAmount: total,
    status: insufficientItems.length ? ORDER_STATUS.PENDING : ORDER_STATUS.ACCEPTED,
    paymentStatus: PAYMENT_STATUS.UNPAID,
    createdBy: getCurrentUser()?.id ?? null,
    createdAt: new Date().toISOString(),
  }
  store.save([...orders, order])
  auditService.log({
    action: AUDIT_ACTIONS.CREATE_ORDER,
    referenceType: 'ORDER',
    referenceId: order.id,
    description: `Order ${order.id} (${order.status === ORDER_STATUS.PENDING ? 'pre-order' : 'normal'}) untuk ${customer.name} sebesar ${formatCurrency(total)}`,
  })
  return { success: true, order }
}

function acceptOrder(orderId) {
  const order = getById(orderId)
  if (!order) return { success: false, error: 'Order tidak ditemukan' }
  if (order.status !== ORDER_STATUS.PENDING) return { success: false, error: 'Hanya order PENDING yang dapat diterima' }
  const insufficientItems = findInsufficientItems(order.items)
  if (insufficientItems.length) {
    return { success: false, error: 'Stok masih belum mencukupi', insufficientItems }
  }
  const updated = update(orderId, { status: ORDER_STATUS.ACCEPTED, acceptedAt: new Date().toISOString() })
  auditService.log({
    action: AUDIT_ACTIONS.ACCEPT_ORDER,
    referenceType: 'ORDER',
    referenceId: orderId,
    description: `Pre-order ${orderId} diterima`,
  })
  return { success: true, order: updated }
}

// Gate rule: only fully PAID orders may leave.
function completeAtGate(orderId) {
  const order = getById(orderId)
  if (!order) return { success: false, error: 'Order tidak ditemukan' }
  if (order.status !== ORDER_STATUS.PAID || order.paymentStatus !== PAYMENT_STATUS.PAID) {
    return { success: false, error: 'Order belum lunas, barang tidak boleh keluar' }
  }
  const user = getCurrentUser()
  const updated = update(orderId, {
    status: ORDER_STATUS.COMPLETED,
    completedAt: new Date().toISOString(),
    completedBy: user?.id ?? null,
  })
  auditService.log({
    action: AUDIT_ACTIONS.GATE_COMPLETED,
    referenceType: 'ORDER',
    referenceId: orderId,
    description: `Barang order ${orderId} (${order.customerName}) dikonfirmasi keluar`,
  })
  return { success: true, order: updated }
}

// Derived, not stored
export function getGateStatus(order) {
  if (order.status === ORDER_STATUS.COMPLETED) return 'COMPLETED'
  if (order.status === ORDER_STATUS.PAID && order.paymentStatus === PAYMENT_STATUS.PAID) return 'READY_TO_EXIT'
  return 'HOLD'
}

export const orderService = { getAll, getById, create, update, acceptOrder, completeAtGate }
