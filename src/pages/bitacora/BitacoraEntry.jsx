import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsRepo } from '../../db/repositories/index.js'
import { entriesRepo } from '../../db/repositories/index.js'
import { useEntries } from '../../hooks/useEntries.js'
import { useWorkers } from '../../hooks/useWorkers.js'
import { useAppContext } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Card from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { toISODate, formatDate, calcHours } from '../../utils/dateHelpers.js'

export default function BitacoraEntry() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useAppContext()
  const { workers, loading: workersLoading } = useWorkers()
  const [project, setProject] = useState(null)
  const [date, setDate] = useState(toISODate())
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1) // 1=check-in, 2=check-out
  const [selectedEntry, setSelectedEntry] = useState(null)

  const { entries, loading: entriesLoading, checkIn, checkOut, reload } = useEntries({
    projectId,
    date,
  })

  useEffect(() => {
    projectsRepo.getById(projectId).then(setProject)
  }, [projectId])

  const [form, setForm] = useState({
    workerId: '',
    checkIn: (() => {
      const now = new Date()
      return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    })(),
    notes: '',
  })
  const [checkOutTime, setCheckOutTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const activeWorkers = workers.filter((w) => w.status === 'active')
  const workerOpts = activeWorkers.map((w) => ({ value: w.id, label: `${w.name} (${w.role})` }))

  // Open entries for today on this project
  const openEntries = entries.filter((e) => e.status === 'open')
  const closedEntries = entries.filter((e) => e.status === 'closed')

  const handleCheckIn = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.workerId) errs.workerId = 'Selecciona un trabajador'
    if (!form.checkIn) errs.checkIn = 'Hora requerida'
    // Check for duplicate open entry
    const existing = entries.find((en) => en.workerId === form.workerId && en.status === 'open')
    if (existing) errs.workerId = 'Este trabajador ya tiene entrada abierta hoy'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      await checkIn({ projectId, workerId: form.workerId, date, checkIn: form.checkIn, notes: form.notes })
      addToast('Entrada registrada', 'success')
      setForm((f) => ({ ...f, workerId: '', notes: '' }))
      setErrors({})
    } catch {
      addToast('Error al registrar entrada', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckOut = async (entry) => {
    if (!checkOutTime) { addToast('Ingresa la hora de salida', 'error'); return }
    setSaving(true)
    try {
      const updated = await checkOut(entry.id, checkOutTime)
      const { totalHours, overtimeHours } = calcHours(entry.checkIn, checkOutTime)
      addToast(`Salida registrada: ${totalHours}h${overtimeHours > 0 ? ` (${overtimeHours}h extra)` : ''}`, 'success')
    } catch {
      addToast('Error al registrar salida', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (workersLoading || !project) return <Spinner className="py-20" />

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/bitacora')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro de Asistencia</h1>
          <p className="text-sm text-blue-700 font-mono">{project.folio} — {project.name}</p>
        </div>
      </div>

      <div className="mb-5">
        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      {/* Check-in form */}
      <Card title="Registrar Entrada" className="mb-5">
        <form onSubmit={handleCheckIn} className="p-5 space-y-4">
          <Select
            label="Trabajador"
            required
            options={workerOpts}
            placeholder="Seleccionar trabajador..."
            value={form.workerId}
            onChange={set('workerId')}
            error={errors.workerId}
          />
          <Input
            label="Hora de Entrada"
            type="time"
            required
            value={form.checkIn}
            onChange={set('checkIn')}
            error={errors.checkIn}
          />
          <Input
            label="Notas (opcional)"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Observaciones..."
          />
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando...' : '✓ Registrar Entrada'}
          </Button>
        </form>
      </Card>

      {/* Open entries - check out */}
      {entriesLoading ? <Spinner className="py-8" /> : (
        <>
          {openEntries.length > 0 && (
            <Card title={`Entradas abiertas (${openEntries.length})`} className="mb-5">
              <div className="p-4 space-y-3">
                <div className="mb-3">
                  <Input label="Hora de Salida" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="max-w-[180px]" />
                </div>
                {openEntries.map((entry) => {
                  const worker = workers.find((w) => w.id === entry.workerId)
                  return (
                    <div key={entry.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-sm">{worker?.name}</p>
                        <p className="text-xs text-gray-500">{worker?.role} · Entrada: {entry.checkIn}</p>
                      </div>
                      <Button size="sm" variant="success" onClick={() => handleCheckOut(entry)} disabled={saving}>
                        Registrar Salida
                      </Button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {closedEntries.length > 0 && (
            <Card title={`Completados hoy (${closedEntries.length})`}>
              <div className="divide-y divide-gray-50">
                {closedEntries.map((entry) => {
                  const worker = workers.find((w) => w.id === entry.workerId)
                  return (
                    <div key={entry.id} className={`flex items-center justify-between px-4 py-3 ${entry.overtimeHours > 0 ? 'bg-amber-50' : ''}`}>
                      <div>
                        <p className="font-medium text-sm">{worker?.name}</p>
                        <p className="text-xs text-gray-500">{entry.checkIn} – {entry.checkOut} · {entry.totalHours}h</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.overtimeHours > 0 && (
                          <span className="text-xs text-amber-700 font-medium">{entry.overtimeHours}h extra</span>
                        )}
                        <Badge status="closed" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
