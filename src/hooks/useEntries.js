import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { entriesRepo } from '../db/repositories/index.js'
import { toISODate, calcHours } from '../utils/dateHelpers.js'

export function useEntries(filters = {}) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      let data

      if (filters.projectId && filters.date) {
        data = await entriesRepo.getByProjectAndDate(filters.projectId, filters.date)
      } else if (filters.projectId) {
        data = await entriesRepo.getByProject(filters.projectId)
      } else if (filters.workerId) {
        data = await entriesRepo.getByWorker(filters.workerId)
      } else if (filters.date) {
        data = await entriesRepo.getByDate(filters.date)
      } else {
        data = await entriesRepo.getAll()
      }

      // Date range filter
      if (filters.startDate && filters.endDate) {
        data = data.filter((e) => e.date >= filters.startDate && e.date <= filters.endDate)
      }

      data.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      setEntries(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.projectId, filters.workerId, filters.date, filters.startDate, filters.endDate])

  useEffect(() => { load() }, [load])

  const checkIn = useCallback(async ({ projectId, workerId, date, checkIn: checkInTime, notes }) => {
    const entry = {
      id: uuidv4(),
      projectId,
      workerId,
      date: date || toISODate(),
      checkIn: checkInTime,
      checkOut: null,
      regularHours: 0,
      overtimeHours: 0,
      totalHours: 0,
      notes: notes || '',
      status: 'open',
      createdAt: Date.now(),
    }
    await entriesRepo.create(entry)
    await load()
    return entry
  }, [load])

  const checkOut = useCallback(async (entryId, checkOutTime, notes) => {
    const entry = await entriesRepo.getById(entryId)
    if (!entry) throw new Error('Entrada no encontrada')
    const { totalHours, regularHours, overtimeHours } = calcHours(entry.checkIn, checkOutTime)
    const updated = {
      ...entry,
      checkOut: checkOutTime,
      totalHours,
      regularHours,
      overtimeHours,
      notes: notes !== undefined ? notes : entry.notes,
      status: 'closed',
    }
    await entriesRepo.update(updated)
    await load()
    return updated
  }, [load])

  const deleteEntry = useCallback(async (id) => {
    await entriesRepo.delete(id)
    await load()
  }, [load])

  return { entries, loading, error, checkIn, checkOut, deleteEntry, reload: load }
}
