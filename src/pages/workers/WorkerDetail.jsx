import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { workersRepo } from '../../db/repositories/index.js'
import { projectsRepo } from '../../db/repositories/index.js'
import { useEntries } from '../../hooks/useEntries.js'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { formatDate } from '../../utils/dateHelpers.js'
import { formatCurrency } from '../../utils/payroll.js'

export default function WorkerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { entries, loading: entriesLoading } = useEntries({ workerId: id })

  useEffect(() => {
    Promise.all([workersRepo.getById(id), projectsRepo.getAll()]).then(([w, ps]) => {
      setWorker(w)
      setProjects(ps)
      setLoading(false)
    })
  }, [id])

  if (loading) return <Spinner className="py-20" />
  if (!worker) return <div className="p-8 text-center text-gray-500">Trabajador no encontrado</div>

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))
  const closedEntries = entries.filter((e) => e.status === 'closed')
  const totalDays = closedEntries.length
  const totalRegularHours = closedEntries.reduce((s, e) => s + e.regularHours, 0)
  const totalOvertimeHours = closedEntries.reduce((s, e) => s + e.overtimeHours, 0)
  const estimatedPay = totalDays * worker.dailyRate + totalOvertimeHours * (worker.dailyRate / 8) * 1.5

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/trabajadores')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
            {worker.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{worker.name}</h1>
              <Badge status={worker.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {worker.role} · {worker.employeeNumber}
              {worker.phone && ` · ${worker.phone}`}
            </p>
            <p className="text-sm text-gray-500">Salario diario: <strong>{formatCurrency(worker.dailyRate)}</strong></p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Días trabajados" value={totalDays} />
        <StatCard label="Hrs. regulares" value={`${totalRegularHours.toFixed(1)}h`} />
        <StatCard label="Hrs. extra" value={`${totalOvertimeHours.toFixed(1)}h`} color="amber" />
        <StatCard label="Estimado total" value={formatCurrency(estimatedPay)} color="green" />
      </div>

      <Card title="Historial de Asistencia">
        {entriesLoading ? <Spinner className="py-8" /> : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Sin registros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Proyecto</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Entrada</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Salida</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Hrs. Extra</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-xs text-blue-700 font-mono">{projectMap[e.projectId]?.folio || '—'}</td>
                    <td className="px-4 py-3">{e.checkIn}</td>
                    <td className="px-4 py-3">{e.checkOut || '—'}</td>
                    <td className="px-4 py-3">{e.overtimeHours > 0 ? <span className="text-amber-700 font-medium">{e.overtimeHours}h</span> : '—'}</td>
                    <td className="px-4 py-3"><Badge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colorClass = color === 'amber' ? 'text-amber-700' : color === 'green' ? 'text-green-700' : 'text-blue-700'
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
      <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
