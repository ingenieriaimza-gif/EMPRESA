import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsRepo } from '../../db/repositories/index.js'
import { useEntries } from '../../hooks/useEntries.js'
import { useExpenses } from '../../hooks/useExpenses.js'
import { usePayroll } from '../../hooks/usePayroll.js'
import { useWorkers } from '../../hooks/useWorkers.js'
import { useAppContext } from '../../context/AppContext.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { formatDate, getMonthRange, toISODate } from '../../utils/dateHelpers.js'
import { formatCurrency } from '../../utils/payroll.js'

const TABS = ['Bitácora', 'Gastos', 'Trabajadores', 'Nómina']

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useAppContext()
  const [project, setProject] = useState(null)
  const [tab, setTab] = useState('Bitácora')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsRepo.getById(id).then((p) => { setProject(p); setLoading(false) })
  }, [id])

  if (loading) return <Spinner className="py-20" />
  if (!project) return <div className="p-8 text-center text-gray-500">Proyecto no encontrado</div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start gap-3 mb-6 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/proyectos')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{project.folio}</span>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <Badge status={project.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {project.client && <span>{project.client} · </span>}
            {project.location && <span>{project.location} · </span>}
            {formatDate(project.startDate)}
            {project.endDate && ` – ${formatDate(project.endDate)}`}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/bitacora/${id}`)}>
          + Registrar entrada
        </Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Bitácora' && <ProjectBitacora projectId={id} />}
      {tab === 'Gastos' && <ProjectGastos projectId={id} />}
      {tab === 'Trabajadores' && <ProjectTrabajadores projectId={id} />}
      {tab === 'Nómina' && <ProjectNomina projectId={id} />}
    </div>
  )
}

function ProjectBitacora({ projectId }) {
  const { entries, loading } = useEntries({ projectId })
  const { workers } = useWorkers()
  const navigate = useNavigate()

  if (loading) return <Spinner className="py-10" />

  const workerMap = Object.fromEntries(workers.map((w) => [w.id, w]))

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-gray-500">{entries.length} registros</p>
        <Button size="sm" onClick={() => navigate(`/bitacora/${projectId}`)}>+ Nuevo registro</Button>
      </div>
      {entries.length === 0 ? (
        <Card><div className="p-8 text-center text-gray-400">Sin registros de bitácora</div></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trabajador</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Entrada</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Salida</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Hrs. Reg.</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Hrs. Extra</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className={`border-b border-gray-50 ${e.overtimeHours > 0 ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 font-medium">{workerMap[e.workerId]?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.checkIn || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.checkOut || '—'}</td>
                    <td className="px-4 py-3">{e.regularHours}h</td>
                    <td className="px-4 py-3">{e.overtimeHours > 0 ? <span className="text-amber-700 font-medium">{e.overtimeHours}h</span> : '—'}</td>
                    <td className="px-4 py-3"><Badge status={e.status} /></td>
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

function ProjectGastos({ projectId }) {
  const { expenses, loading, grandTotal, totalByCategory, deleteExpense } = useExpenses({ projectId })
  const { addToast } = useAppContext()

  if (loading) return <Spinner className="py-10" />

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-gray-500">Total: <strong className="text-gray-900">{formatCurrency(grandTotal)}</strong></p>
      </div>
      {expenses.length === 0 ? (
        <Card><div className="p-8 text-center text-gray-400">Sin gastos registrados</div></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Categoría</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Descripción</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Monto</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{e.category}</span></td>
                    <td className="px-4 py-3 text-gray-700">{e.description}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="danger" onClick={async () => { await deleteExpense(e.id); addToast('Gasto eliminado') }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
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

function ProjectTrabajadores({ projectId }) {
  const { entries, loading } = useEntries({ projectId })
  const { workers } = useWorkers()
  const navigate = useNavigate()

  if (loading) return <Spinner className="py-10" />

  const workerIds = [...new Set(entries.map((e) => e.workerId))]
  const projectWorkers = workers.filter((w) => workerIds.includes(w.id))

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{projectWorkers.length} trabajador{projectWorkers.length !== 1 ? 'es' : ''} en este proyecto</p>
      {projectWorkers.length === 0 ? (
        <Card><div className="p-8 text-center text-gray-400">Sin trabajadores asignados aún</div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projectWorkers.map((w) => {
            const workerEntries = entries.filter((e) => e.workerId === w.id && e.status === 'closed')
            const totalOT = workerEntries.reduce((s, e) => s + e.overtimeHours, 0)
            return (
              <Card key={w.id} className="p-4 cursor-pointer hover:border-blue-200 transition-colors" onClick={() => navigate(`/trabajadores/${w.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{w.name}</p>
                    <p className="text-xs text-gray-500">{w.role} · {w.employeeNumber}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{workerEntries.length} días</p>
                    {totalOT > 0 && <p className="text-amber-700">{totalOT.toFixed(1)}h extra</p>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProjectNomina({ projectId }) {
  const now = new Date()
  const period = getMonthRange(now.getFullYear(), now.getMonth() + 1)
  const { rows, grandTotal, loading } = usePayroll(period, projectId)

  if (loading) return <Spinner className="py-10" />

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Período: {formatDate(period.start)} – {formatDate(period.end)}</p>
      {rows.length === 0 ? (
        <Card><div className="p-8 text-center text-gray-400">Sin datos de nómina este mes</div></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trabajador</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Días</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Hrs. Extra</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Regular</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Extra</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.workerId} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.workerName}</p>
                      <p className="text-xs text-gray-400">{r.role}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{r.regularDays}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{r.overtimeHours > 0 ? `${r.overtimeHours}h` : '—'}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(r.regularPay)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{r.overtimePay > 0 ? formatCurrency(r.overtimePay) : '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(r.totalPay)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={5} className="px-4 py-3 text-right text-gray-700">Total Nómina</td>
                  <td className="px-4 py-3 text-right text-green-700">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
