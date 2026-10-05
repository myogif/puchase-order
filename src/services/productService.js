import initialData from '../data/products.json'
import { createStore } from './storageService'
import { generateId } from '../utils/idGenerator'
import { auditService } from './auditService'
import { stockService } from './stockService'
import { AUDIT_ACTIONS } from '../utils/constants'

const store = createStore('roti_products', initialData)

function getAll() {
  return store.getAll()
}

function getById(id) {
  return store.getAll().find(p => p.id === id) ?? null
}

function findByBarcode(barcode) {
  const code = barcode.trim()
  return store.getAll().find(p => p.barcode === code) ?? null
}

function validate(data, excludeId) {
  const products = store.getAll().filter(p => p.id !== excludeId)
  if (!data.sku?.trim()) return 'SKU wajib diisi'
  if (!data.barcode?.trim()) return 'Barcode wajib diisi'
  if (!data.name?.trim()) return 'Nama produk wajib diisi'
  if (!(Number(data.price) >= 0) || data.price === '') return 'Harga jual harus ≥ 0'
  if (products.some(p => p.sku === data.sku.trim())) return 'SKU sudah digunakan'
  if (products.some(p => p.barcode === data.barcode.trim())) return 'Barcode sudah digunakan'
  return null
}

function create(data) {
  const error = validate(data)
  if (error) return { success: false, error }
  const products = store.getAll()
  const product = {
    id: generateId('PRD', products),
    sku: data.sku.trim(),
    barcode: data.barcode.trim(),
    name: data.name.trim(),
    category: data.category,
    price: Number(data.price),
    stock: Number(data.stock) || 0,
    minimumStock: Number(data.minimumStock) || 0,
    image: data.image ?? null,
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
  }
  store.save([...products, product])
  auditService.log({
    action: AUDIT_ACTIONS.CREATE_PRODUCT,
    referenceType: 'PRODUCT',
    referenceId: product.id,
    description: `Produk ${product.name} (${product.sku}) dibuat`,
  })
  return { success: true, product }
}

// Stock is intentionally not updatable here — it changes only via stock-in or order payment.
function update(id, data) {
  const error = validate(data, id)
  if (error) return { success: false, error }
  const products = store.getAll()
  const existing = products.find(p => p.id === id)
  if (!existing) return { success: false, error: 'Produk tidak ditemukan' }
  const product = {
    ...existing,
    sku: data.sku.trim(),
    barcode: data.barcode.trim(),
    name: data.name.trim(),
    category: data.category,
    price: Number(data.price),
    minimumStock: Number(data.minimumStock) || 0,
    image: data.image ?? null,
    isActive: data.isActive,
  }
  store.save(products.map(p => (p.id === id ? product : p)))
  auditService.log({
    action: AUDIT_ACTIONS.UPDATE_PRODUCT,
    referenceType: 'PRODUCT',
    referenceId: id,
    description: `Produk ${product.name} (${product.sku}) diperbarui`,
  })
  return { success: true, product }
}

function remove(id) {
  const existing = getById(id)
  if (!existing) return { success: false, error: 'Produk tidak ditemukan' }
  return update(id, { ...existing, isActive: false })
}

// Low-level stock mutation; callers own validation, movement records and audit.
function updateStock(id, quantityChange) {
  const products = store.getAll()
  store.save(products.map(p => (p.id === id ? { ...p, stock: p.stock + quantityChange } : p)))
}

function stockIn({ productId, quantity, date, note }) {
  const qty = Number(quantity)
  const product = getById(productId)
  if (!product) return { success: false, error: 'Produk wajib dipilih' }
  if (!Number.isInteger(qty) || qty <= 0) return { success: false, error: 'Jumlah harus lebih dari 0' }

  updateStock(productId, qty)
  // Keep the chosen day but stamp the current time so same-day ordering stays meaningful
  const now = new Date()
  const createdAt = date
    ? new Date(`${date}T${now.toTimeString().slice(0, 8)}`).toISOString()
    : now.toISOString()
  const movement = stockService.create({
    productId,
    productName: product.name,
    type: 'IN',
    quantity: qty,
    referenceType: 'STOCK_IN',
    referenceId: null,
    note: note?.trim() ?? '',
    createdAt,
  })
  auditService.log({
    action: AUDIT_ACTIONS.STOCK_IN,
    referenceType: 'STOCK_MOVEMENT',
    referenceId: movement.id,
    description: `Barang masuk ${product.name} sebanyak ${qty}`,
  })
  return { success: true, movement, product: getById(productId) }
}

export function getStockStatus(product) {
  if (product.stock <= 0) return 'OUT_OF_STOCK'
  if (product.stock <= product.minimumStock) return 'LOW_STOCK'
  return 'SAFE'
}

export const productService = {
  getAll,
  getById,
  findByBarcode,
  create,
  update,
  delete: remove,
  updateStock,
  stockIn,
}
