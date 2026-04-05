import { idb } from '../idb.js'

export const projectsRepo = {
  getAll: () => idb.getAll('projects'),
  getById: (id) => idb.get('projects', id),
  getByStatus: (status) => idb.getByIndex('projects', 'status', status),
  create: (data) => idb.add('projects', data),
  update: (data) => idb.put('projects', data),
  delete: (id) => idb.delete('projects', id),
  getNextFolioNumber: () => idb.getCounter('projectCounter'),
}
