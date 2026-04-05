import { isDateInRange } from './dateHelpers.js'

const OVERTIME_MULTIPLIER = 1.5

export function calcWorkerPayroll(worker, entries, period) {
  const { start, end } = period
  const workerEntries = entries.filter(
    (e) => e.workerId === worker.id && isDateInRange(e.date, start, end) && e.status === 'closed'
  )

  const regularHours = workerEntries.reduce((sum, e) => sum + (e.regularHours || 0), 0)
  const overtimeHours = workerEntries.reduce((sum, e) => sum + (e.overtimeHours || 0), 0)
  const regularDays = workerEntries.length

  const dailyRate = worker.dailyRate || 0
  const hourlyRate = dailyRate / 8

  const regularPay = regularDays * dailyRate
  const overtimePay = Math.round(overtimeHours * hourlyRate * OVERTIME_MULTIPLIER * 100) / 100
  const totalPay = Math.round((regularPay + overtimePay) * 100) / 100

  return {
    workerId: worker.id,
    workerName: worker.name,
    employeeNumber: worker.employeeNumber,
    role: worker.role,
    dailyRate,
    period,
    regularDays,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    regularPay,
    overtimePay,
    totalPay,
    entries: workerEntries,
  }
}

export function calcPayrollReport(workers, entries, period) {
  const rows = workers.map((w) => calcWorkerPayroll(w, entries, period))
  const grandTotal = rows.reduce((sum, r) => sum + r.totalPay, 0)
  return { rows, grandTotal: Math.round(grandTotal * 100) / 100 }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}
