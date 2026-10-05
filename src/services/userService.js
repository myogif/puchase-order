import initialData from '../data/users.json'
import { createStore } from './storageService'

const store = createStore('roti_users', initialData)

function stripPassword({ password: _password, ...user }) {
  return user
}

function getAll() {
  return store.getAll().map(stripPassword)
}

function getById(id) {
  const user = store.getAll().find(u => u.id === id)
  return user ? stripPassword(user) : null
}

function authenticate(username, password) {
  const user = store.getAll().find(u => u.username === username.trim() && u.password === password)
  return user ? stripPassword(user) : null
}

export const userService = { getAll, getById, authenticate }
