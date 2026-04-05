import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkers } from '../../hooks/useWorkers.js'
import { useAppContext } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { formatCurrency } from '../../utils/payroll.js'

const ROLES = ['Albañil', 'Electricista', 'Plomero', 'Supervisor', 'General', 'Carpintero', 'Fierrero', 'Otro']

const STATUS_OPTS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const ROLE_OPTS = ROLES.map((r) => ({ value: r, label: r }))

function WorkerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', role: 'Albañil', dailyRate: '350', phone: '', status: 'active',
  })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nombre requerido'
    if (isNaN(Number(form.dailyRate)) || Number(form.dailyRate) < 0) errs.dailyRate = 'Inválido'
    return errs
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, dailyRate: parseFloat(form.dailyRate) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Nombre Completo" required value={form.name} onChange={set('name')} error={errors.name} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Cargo" options={ROLE_OPTS} value={form.role} onChange={set('role')} />
        <Select label="Estado" options={STATUS_OPTS} value={form.status} onChange={set('status')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Salario Diario" type="number" min="0" step="0.01" prefix="$" value={form.dailyRate} onChange={set('dailyRate')} error={errors.dailyRate} />
        <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} placeholder="81-xxxx-xxxx" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">Guardar</Button>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function WorkerList() {
  const navigate = useNavigate()
  const { workers, loading, createWorker, updateWorker, deleteWorker } = useWorkers()
  const { addToast } = useAppContext()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = workers.filter((w) =>
    !search ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
    w.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (data) => {
    try {
      await createWorker(data)
      addToast('Trabajador registrado', 'success')
      setShowCreate(false)
    } catch { addToast('Error al guardar', 'error') }
  }

  const handleUpdate = async (data) => {
    try {
      await updateWorker({ ...editTarget, ...data })
      addToast('Trabajador actualizado', 'success')
      setEditTarget(null)
    } catch { addToast('Error al actualizar', 'error') }
  }

  const handleDelete = async () => {
    try {
      await deleteWorker(deleteTarget.id)
      addToast('Trabajador eliminado', 'success')
    } catch { addToast('Error al eliminar', 'error') }
    setDeleteTarget(null)
  }

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workers.filter(w => w.status === 'active').length} activos</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo
        </Button>
      </div>

      <input
        type="text"
        placeholder="Buscar trabajador..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtered.length === 0 ? (
        <EmptyState icon="👷" title="Sin trabajadores" description="Registra los trabajadores de tu equipo" action={() => setShowCreate(true)} actionLabel="Agregar Trabajador" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">No. Empleado</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Cargo</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Salario/Día</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{w.employeeNumber}</td>
                    <td className="px-4 py-3 font-medium cursor-pointer hover:text-blue-700" onClick={() => navigate(`/trabajadores/${w.id}`)}>{w.name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{w.role}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{formatCurrency(w.dailyRate)}</td>
                    <td className="px-4 py-3"><Badge status={w.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditTarget(w)}>Editar</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(w)}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Trabajador">
        <WorkerForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Trabajador">
        {editTarget && (
          <WorkerForm
            initial={{ ...editTarget, dailyRate: String(editTarget.dailyRate) }}
            onSave={handleUpdate}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar Trabajador">
        <p className="text-gray-600 mb-6">¿Eliminar a <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
