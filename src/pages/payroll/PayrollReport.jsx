import { useState, useEffect } from 'react'
import { usePayroll } from '../../hooks/usePayroll.js'
import { useProjects } from '../../hooks/useProjects.js'
import Card from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Button from '../../components/ui/Button.jsx'
import { formatDate, getWeekRange, getMonthRange, monthName } from '../../utils/dateHelpers.js'
import { formatCurrency } from '../../utils/payroll.js'
import { exportToCsv } from '../../utils/exportCsv.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PayrollReport() {
  const now = new Date()
  const [mode, setMode] = useState('month')
  const [period, setPeriod] = useState(getMonthRange(now.getFullYear(), now.getMonth() + 1))
  const [projectFilter, setProjectFilter] = useState('')
  const { projects } = useProjects()
  const { rows, grandTotal, loading } = usePayroll(period, projectFilter || null)

  const shiftPeriod = (dir) => {
    if (mode === 'week') {
      const start = new Date(period.start)
      start.setDate(start.getDate() + dir * 7)
      setPeriod(getWeekRange(start))
    } else {
      const [y, m] = period.start.split('-').map(Number)
      const newM = m + dir
      const d = new Date(y, newM - 1, 1)
      setPeriod(getMonthRange(d.getFullYear(), d.getMonth() + 1))
    }
  }

  useEffect(() => {
    if (mode === 'week') setPeriod(getWeekRange())
    else setPeriod(getMonthRange(now.getFullYear(), now.getMonth() + 1))
  }, [mode])

  const chartData = rows.slice(0, 8).map((r) => ({
    name: r.workerName.split(' ')[0],
    Regular: r.regularPay,
    Extra: r.overtimePay,
  }))

  const handleExport = () => {
    exportToCsv('nomina.csv', rows, [
      { label: 'No. Empleado', key: 'employeeNumber' },
      { label: 'Nombre', key: 'workerName' },
      { label: 'Cargo', key: 'role' },
      { label: 'Días trabajados', key: 'regularDays' },
      { label: 'Hrs. regulares', key: 'regularHours' },
      { label: 'Hrs. extra', key: 'overtimeHours' },
      { label: 'Pago regular', key: 'regularPay' },
      { label: 'Pago extra', key: 'overtimePay' },
      { label: 'Total', key: 'totalPay' },
    ])
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nómina</h1>
          <p className="text-sm text-gray-500 mt-0.5">Reporte de pago de trabajadores</p>
        </div>
        {rows.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar CSV
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button onClick={() => setMode('week')} className={`px-4 py-2 text-sm font-medium ${mode === 'week' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Semana</button>
          <button onClick={() => setMode('month')} className={`px-4 py-2 text-sm font-medium ${mode === 'month' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Mes</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftPeriod(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {formatDate(period.start)} – {formatDate(period.end)}
          </span>
          <button onClick={() => shiftPeriod(1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los proyectos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.folio} — {p.name}</option>)}
        </select>
      </div>

      {loading ? <Spinner className="py-20" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-700">{rows.length}</p>
              <p className="text-xs text-gray-500 mt-1">Trabajadores</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-700">{rows.reduce((s, r) => s + r.regularDays, 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Total días trabajados</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-amber-600">{rows.reduce((s, r) => s + r.overtimeHours, 0).toFixed(1)}h</p>
              <p className="text-xs text-gray-500 mt-1">Horas extra</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-green-700">{formatCurrency(grandTotal)}</p>
              <p className="text-xs text-gray-500 mt-1">Total nómina</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <Card title="Pago por Trabajador" className="mb-6">
              <div className="h-64 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="Regular" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Extra" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {rows.length === 0 ? (
            <Card><div className="p-10 text-center text-gray-400">Sin datos de nómina en este período</div></Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Empleado</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Días</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Hrs. Reg.</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Hrs. Extra</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Regular</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Extra</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.workerId} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{r.workerName}</p>
                          <p className="text-xs text-gray-400">{r.role} · {r.employeeNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{r.regularDays}</td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">{r.regularHours}h</td>
                        <td className="px-4 py-3 text-right text-amber-700">{r.overtimeHours > 0 ? `${r.overtimeHours}h` : '—'}</td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">{formatCurrency(r.regularPay)}</td>
                        <td className="px-4 py-3 text-right text-amber-700 hidden md:table-cell">{r.overtimePay > 0 ? formatCurrency(r.overtimePay) : '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(r.totalPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                      <td colSpan={6} className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">Total Nómina</td>
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-700 md:hidden">Total Nómina</td>
                      <td className="px-4 py-3 text-right text-green-700 text-base">{formatCurrency(grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
