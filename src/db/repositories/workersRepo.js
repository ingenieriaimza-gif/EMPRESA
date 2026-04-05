import { idb } from '../idb.js'

export const workersRepo = {
  getAll: () => idb.getAll('workers'),
  getById: (id) => idb.get('workers', id),
  getByStatus: (status) => idb.getByIndex('workers', 'status', status),
  create: (data) => idb.add('workers', data),
  update: (data) => idb.put('workers', data),
  delete: (id) => idb.delete('workers', id),
  getNextEmployeeNumber: () => idb.getCounter('workerCounter'),
}
