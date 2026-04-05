import { useState, useEffect } from 'react'
import { useEntries } from '../../hooks/useEntries.js'
import { useWorkers } from '../../hooks/useWorkers.js'
import { useProjects } from '../../hooks/useProjects.js'
import Card from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { formatDate, getWeekRange, getMonthRange, toISODate, monthName } from '../../utils/dateHelpers.js'
import { formatCurrency } from '../../utils/payroll.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function OvertimeDashboard() {
  const now = new Date()
  const [mode, setMode] = useState('week')
  const [period, setPeriod] = useState(getWeekRange())
  const [projectFilter, setProjectFilter] = useState('')

  const { entries, loading } = useEntries({ startDate: period.start, endDate: period.end })
  const { workers } = useWorkers()
  const { projects } = useProjects()

  const workerMap = Object.fromEntries(workers.map((w) => [w.id, w]))

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

  const filtered = entries.filter(
    (e) => e.status === 'closed' && e.overtimeHours > 0 && (!projectFilter || e.projectId === projectFilter)
  )

  // Group by worker
  const byWorker = {}
  filtered.forEach((e) => {
    if (!byWorker[e.workerId]) {
      const w = workerMap[e.workerId]
      byWorker[e.workerId] = {
        name: w?.name || '—',
        role: w?.role || '',
        dailyRate: w?.dailyRate || 0,
        overtimeHours: 0,
        days: 0,
        cost: 0,
      }
    }
    byWorker[e.workerId].overtimeHours += e.overtimeHours
    byWorker[e.workerId].days += 1
    const hourlyRate = byWorker[e.workerId].dailyRate / 8
    byWorker[e.workerId].cost += e.overtimeHours * hourlyRate * 1.5
  })

  const rows = Object.values(byWorker).sort((a, b) => b.overtimeHours - a.overtimeHours)
  const totalOT = rows.reduce((s, r) => s + r.overtimeHours, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost, 0)

  const chartData = rows.slice(0, 10).map((r) => ({
    name: r.name.split(' ')[0],
    'Hrs. Extra': Math.round(r.overtimeHours * 10) / 10,
  }))

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Horas Extra</h1>
        <p className="text-sm text-gray-500 mt-0.5">Control de tiempo extraordinario</p>
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
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.folio} — {p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-600">{totalOT.toFixed(1)}h</p>
          <p className="text-xs text-gray-500 mt-1">Total horas extra</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-gray-500 mt-1">Costo extraordinario</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-blue-700">{rows.length}</p>
          <p className="text-xs text-gray-500 mt-1">Trabajadores con horas extra</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <Card title="Top 10 — Horas Extra por Trabajador" className="mb-6">
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}h`, 'Horas Extra']} />
                <Bar dataKey="Hrs. Extra" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card><div className="p-10 text-center text-gray-400">Sin horas extra en este período</div></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trabajador</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Días</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Hrs. Extra</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Costo Extra</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.role}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{r.days}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-700">{r.overtimeHours.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
