import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { workersRepo } from '../db/repositories/index.js'
import { generateEmployeeNumber } from '../utils/folio.js'

export function useWorkers() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await workersRepo.getAll()
      data.sort((a, b) => a.name.localeCompare(b.name))
      setWorkers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createWorker = useCallback(async (formData) => {
    const counter = await workersRepo.getNextEmployeeNumber()
    const employeeNumber = generateEmployeeNumber(counter)
    const worker = {
      id: uuidv4(),
      employeeNumber,
      ...formData,
      status: formData.status || 'active',
      createdAt: Date.now(),
    }
    await workersRepo.create(worker)
    await load()
    return worker
  }, [load])

  const updateWorker = useCallback(async (worker) => {
    await workersRepo.update(worker)
    await load()
  }, [load])

  const deleteWorker = useCallback(async (id) => {
    await workersRepo.delete(id)
    await load()
  }, [load])

  return { workers, loading, error, createWorker, updateWorker, deleteWorker, reload: load }
}
