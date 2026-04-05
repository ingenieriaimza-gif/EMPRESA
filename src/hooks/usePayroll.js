import { useState, useEffect } from 'react'
import { entriesRepo } from '../db/repositories/index.js'
import { workersRepo } from '../db/repositories/index.js'
import { calcPayrollReport } from '../utils/payroll.js'

export function usePayroll(period, projectId = null) {
  const [report, setReport] = useState({ rows: [], grandTotal: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!period?.start || !period?.end) return

    let cancelled = false
    async function compute() {
      try {
        setLoading(true)
        const [allWorkers, allEntries] = await Promise.all([
          workersRepo.getAll(),
          entriesRepo.getAll(),
        ])

        let entries = allEntries.filter(
          (e) => e.date >= period.start && e.date <= period.end && e.status === 'closed'
        )
        if (projectId) {
          entries = entries.filter((e) => e.projectId === projectId)
        }

        // Only include workers who have entries in this period
        const workerIds = new Set(entries.map((e) => e.workerId))
        const workers = allWorkers.filter((w) => workerIds.has(w.id))

        const result = calcPayrollReport(workers, entries, period)
        if (!cancelled) setReport(result)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    compute()
    return () => { cancelled = true }
  }, [period?.start, period?.end, projectId])

  return { ...report, loading, error }
}
