import initialData from '../data/payments.json'
import { createStore, getCurrentUser } from './storageService'
import { generateId } from '../utils/idGenerator'
import { auditService } from './auditService'
import { orderService } from './orderService'
import { productService } from './productService'
import { stockService } from './stockService'
import { AUDIT_ACTIONS, ORDER_STATUS, PAYMENT_STATUS } from '../utils/constants'
import { formatCurrency } from '../utils/format'

const store = createStore('roti_payments', initialData)

function getAll() {
  return store.getAll()
}

function getByOrder(orderId) {
  return store.getAll().filter(p => p.orderId === orderId)
}

/**
 * Records a payment. Stock is deducted exactly once: on the payment that moves
 * the order out of UNPAID (DP or full). Later payments never touch stock.
 */
function createPayment(orderId, amount, method = 'CASH') {
  const order = orderService.getById(orderId)
  const value = Number(amount)
  if (!order) return { success: false, error: 'Order tidak ditemukan' }
  if (order.status === ORDER_STATUS.PENDING) {
    return { success: false, error: 'Pre-order belum diterima, terima order terlebih dahulu' }
  }
  if (order.paymentStatus === PAYMENT_STATUS.PAID) return { success: false, error: 'Order sudah lunas' }
  if (!(value > 0)) return { success: false, error: 'Jumlah pembayaran harus lebih dari 0' }
  if (value > order.remainingAmount) {
    return { success: false, error: `Jumlah melebihi sisa tagihan (${formatCurrency(order.remainingAmount)})` }
  }

  const isFirstPayment = order.paymentStatus === PAYMENT_STATUS.UNPAID
  if (isFirstPayment) {
    const short = order.items.filter(i => (productService.getById(i.productId)?.stock ?? 0) < i.quantity)
    if (short.length) {
      return { success: false, error: `Stok tidak mencukupi: ${short.map(i => i.productName).join(', ')}` }
    }
  }

  const user = getCurrentUser()
  const payments = store.getAll()
  const payment = {
    id: generateId('PAY', payments),
    orderId,
    amount: value,
    method,
    createdBy: user?.id ?? null,
    createdAt: new Date().toISOString(),
  }
  store.save([...payments, payment])

  const paidAmount = order.paidAmount + value
  const fullyPaid = paidAmount >= order.total
  const updatedOrder = orderService.update(orderId, {
    paidAmount,
    remainingAmount: Math.max(order.total - paidAmount, 0),
    paymentStatus: fullyPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIAL,
    status: fullyPaid ? ORDER_STATUS.PAID : order.status,
  })

  if (isFirstPayment) {
    for (const item of order.items) {
      productService.updateStock(item.productId, -item.quantity)
      stockService.create({
        productId: item.productId,
        productName: item.productName,
        type: 'OUT',
        quantity: item.quantity,
        referenceType: 'ORDER',
        referenceId: orderId,
        note: `Pengeluaran order ${orderId}`,
      })
    }
  }

  auditService.log({
    action: AUDIT_ACTIONS.CREATE_PAYMENT,
    referenceType: 'ORDER',
    referenceId: orderId,
    description: `Pembayaran ${formatCurrency(value)} untuk ${orderId} (${updatedOrder.paymentStatus})`,
  })
  return { success: true, payment, order: updatedOrder, stockDeducted: isFirstPayment }
}

export const paymentService = { getAll, getByOrder, createPayment }
