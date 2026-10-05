import initialData from '../data/stockMovements.json'
import { createStore, getCurrentUser } from './storageService'
import { generateId } from '../utils/idGenerator'

const store = createStore('roti_stock_movements', initialData)

function getAll() {
  return store.getAll()
}

function getByProduct(productId) {
  return store.getAll().filter(m => m.productId === productId)
}

function create(movement) {
  const movements = store.getAll()
  const record = {
    referenceId: null,
    note: '',
    ...movement,
    id: generateId('SM', movements),
    createdBy: movement.createdBy ?? getCurrentUser()?.id ?? null,
    createdAt: movement.createdAt ?? new Date().toISOString(),
  }
  store.save([...movements, record])
  return record
}

export const stockService = { getAll, getByProduct, create }
