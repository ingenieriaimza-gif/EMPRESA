const DB_NAME = 'empresa-db'
const DB_VERSION = 1

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const ps = db.createObjectStore('projects', { keyPath: 'id' })
        ps.createIndex('folio', 'folio', { unique: true })
        ps.createIndex('status', 'status', { unique: false })
      }

      // Workers store
      if (!db.objectStoreNames.contains('workers')) {
        const ws = db.createObjectStore('workers', { keyPath: 'id' })
        ws.createIndex('employeeNumber', 'employeeNumber', { unique: true })
        ws.createIndex('status', 'status', { unique: false })
      }

      // Entries (bitácora) store
      if (!db.objectStoreNames.contains('entries')) {
        const es = db.createObjectStore('entries', { keyPath: 'id' })
        es.createIndex('projectId', 'projectId', { unique: false })
        es.createIndex('workerId', 'workerId', { unique: false })
        es.createIndex('date', 'date', { unique: false })
        es.createIndex('projectDate', ['projectId', 'date'], { unique: false })
        es.createIndex('workerDate', ['workerId', 'date'], { unique: false })
        es.createIndex('status', 'status', { unique: false })
      }

      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const exs = db.createObjectStore('expenses', { keyPath: 'id' })
        exs.createIndex('projectId', 'projectId', { unique: false })
        exs.createIndex('date', 'date', { unique: false })
        exs.createIndex('category', 'category', { unique: false })
      }

      // Meta store for counters
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

export const idb = {
  async getAll(storeName) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const req = tx.objectStore(storeName).getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async get(storeName, key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const req = tx.objectStore(storeName).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async getByIndex(storeName, indexName, value) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const req = tx.objectStore(storeName).index(indexName).getAll(value)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async add(storeName, data) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const req = tx.objectStore(storeName).add(data)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async put(storeName, data) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const req = tx.objectStore(storeName).put(data)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async delete(storeName, key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const req = tx.objectStore(storeName).delete(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async getCounter(key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite')
      const store = tx.objectStore('meta')
      const req = store.get(key)
      req.onsuccess = () => {
        const current = req.result ? req.result.value : 0
        const next = current + 1
        store.put({ key, value: next })
        resolve(next)
      }
      req.onerror = () => reject(req.error)
    })
  }
}
