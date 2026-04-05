import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../../hooks/useEntries.js'
import { useWorkers } from '../../hooks/useWorkers.js'
import { useProjects } from '../../hooks/useProjects.js'
import { useAppContext } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { toISODate, formatDate } from '../../utils/dateHelpers.js'

export default function BitacoraList() {
  const navigate = useNavigate()
  const { addToast } = useAppContext()
  const [date, setDate] = useState(toISODate())
  const [projectFilter, setProjectFilter] = useState('')

  const { entries, loading, checkOut, reload } = useEntries({ date })
  const { workers } = useWorkers()
  const { projects } = useProjects()

  const workerMap = Object.fromEntries(workers.map((w) => [w.id, w]))
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))

  const filtered = entries.filter((e) => !projectFilter || e.projectId === projectFilter)

  const handleCheckOut = async (entry) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    try {
      await checkOut(entry.id, time)
      addToast('Salida registrada', 'success')
    } catch {
      addToast('Error al registrar salida', 'error')
    }
  }

  if (loading) return <Spinner className="py-20" />

  const activeProjects = projects.filter((p) => p.status === 'active')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bitácora</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro diario de asistencia</p>
        </div>
        {activeProjects.length > 0 && (
          <Button onClick={() => navigate(`/bitacora/${activeProjects[0].id}`)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo registro
          </Button>
        )}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[160px]"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.folio} — {p.name}</option>
          ))}
        </select>
      </div>

      {activeProjects.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {activeProjects.map((p) => (
            <Button key={p.id} size="sm" variant="secondary" onClick={() => navigate(`/bitacora/${p.id}`)}>
              + {p.folio}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Sin registros"
          description={`No hay entradas para el ${formatDate(date)}`}
          action={activeProjects.length > 0 ? () => navigate(`/bitacora/${activeProjects[0].id}`) : undefined}
          actionLabel="Registrar entrada"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trabajador</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Proyecto</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Entrada</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Salida</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Hrs.</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Extra</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className={`border-b border-gray-50 transition-colors ${e.overtimeHours > 0 ? 'bg-amber-50' : e.status === 'open' ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{workerMap[e.workerId]?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{workerMap[e.workerId]?.role}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-blue-700 font-mono">{projectMap[e.projectId]?.folio || '—'}</td>
                    <td className="px-4 py-3">{e.checkIn}</td>
                    <td className="px-4 py-3">{e.checkOut || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">{e.status === 'closed' ? `${e.totalHours}h` : '—'}</td>
                    <td className="px-4 py-3">{e.overtimeHours > 0 ? <span className="text-amber-700 font-medium">{e.overtimeHours}h</span> : '—'}</td>
                    <td className="px-4 py-3"><Badge status={e.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {e.status === 'open' && (
                        <Button size="sm" variant="success" onClick={() => handleCheckOut(e)}>
                          Registrar Salida
                        </Button>
                      )}
                    </td>
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
