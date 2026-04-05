import { idb } from '../idb.js'

export const expensesRepo = {
  getAll: () => idb.getAll('expenses'),
  getById: (id) => idb.get('expenses', id),
  getByProject: (projectId) => idb.getByIndex('expenses', 'projectId', projectId),
  getByDate: (date) => idb.getByIndex('expenses', 'date', date),
  getByCategory: (category) => idb.getByIndex('expenses', 'category', category),
  create: (data) => idb.add('expenses', data),
  update: (data) => idb.put('expenses', data),
  delete: (id) => idb.delete('expenses', id),
}
