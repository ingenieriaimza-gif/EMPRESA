import { idb } from '../idb.js'

export const entriesRepo = {
  getAll: () => idb.getAll('entries'),
  getById: (id) => idb.get('entries', id),
  getByProject: (projectId) => idb.getByIndex('entries', 'projectId', projectId),
  getByWorker: (workerId) => idb.getByIndex('entries', 'workerId', workerId),
  getByDate: (date) => idb.getByIndex('entries', 'date', date),
  getByProjectAndDate: (projectId, date) =>
    idb.getByIndex('entries', 'projectDate', [projectId, date]),
  getByWorkerAndDate: (workerId, date) =>
    idb.getByIndex('entries', 'workerDate', [workerId, date]),
  getOpenEntries: () => idb.getByIndex('entries', 'status', 'open'),
  create: (data) => idb.add('entries', data),
  update: (data) => idb.put('entries', data),
  delete: (id) => idb.delete('entries', id),
}
