import initialData from '../data/customers.json'
import { createStore } from './storageService'
import { generateId } from '../utils/idGenerator'
import { auditService } from './auditService'
import { AUDIT_ACTIONS } from '../utils/constants'

const store = createStore('roti_customers', initialData)

function getAll() {
  return store.getAll()
}

function getById(id) {
  return store.getAll().find(c => c.id === id) ?? null
}

function validate(data) {
  if (!data.name?.trim()) return 'Nama wajib diisi'
  if (!data.phone?.trim()) return 'Telepon wajib diisi'
  if (!data.address?.trim()) return 'Alamat wajib diisi'
  return null
}

function create(data) {
  const error = validate(data)
  if (error) return { success: false, error }
  const customers = store.getAll()
  const customer = {
    id: generateId('CUS', customers),
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
  }
  store.save([...customers, customer])
  auditService.log({
    action: AUDIT_ACTIONS.CREATE_CUSTOMER,
    referenceType: 'CUSTOMER',
    referenceId: customer.id,
    description: `Pelanggan ${customer.name} dibuat`,
  })
  return { success: true, customer }
}

function update(id, data) {
  const error = validate(data)
  if (error) return { success: false, error }
  const customers = store.getAll()
  const existing = customers.find(c => c.id === id)
  if (!existing) return { success: false, error: 'Pelanggan tidak ditemukan' }
  const customer = {
    ...existing,
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    isActive: data.isActive,
  }
  store.save(customers.map(c => (c.id === id ? customer : c)))
  auditService.log({
    action: AUDIT_ACTIONS.UPDATE_CUSTOMER,
    referenceType: 'CUSTOMER',
    referenceId: id,
    description: `Pelanggan ${customer.name} diperbarui`,
  })
  return { success: true, customer }
}

// Soft delete
function remove(id) {
  const customers = store.getAll()
  const existing = customers.find(c => c.id === id)
  if (!existing) return { success: false, error: 'Pelanggan tidak ditemukan' }
  store.save(customers.map(c => (c.id === id ? { ...c, isActive: false } : c)))
  auditService.log({
    action: AUDIT_ACTIONS.DEACTIVATE_CUSTOMER,
    referenceType: 'CUSTOMER',
    referenceId: id,
    description: `Pelanggan ${existing.name} dinonaktifkan`,
  })
  return { success: true }
}

export const customerService = { getAll, getById, create, update, delete: remove }
