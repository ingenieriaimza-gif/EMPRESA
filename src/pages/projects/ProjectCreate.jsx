import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects.js'
import { useAppContext } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Card from '../../components/ui/Card.jsx'
import { toISODate } from '../../utils/dateHelpers.js'

const STATUS_OPTS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
]

export default function ProjectCreate() {
  const navigate = useNavigate()
  const { createProject } = useProjects()
  const { addToast } = useAppContext()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    client: '',
    location: '',
    startDate: toISODate(),
    endDate: '',
    status: 'active',
    dailyRateRegular: '350',
    description: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nombre requerido'
    if (!form.startDate) errs.startDate = 'Fecha requerida'
    if (isNaN(Number(form.dailyRateRegular)) || Number(form.dailyRateRegular) < 0)
      errs.dailyRateRegular = 'Importe inválido'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const project = await createProject({
        ...form,
        dailyRateRegular: parseFloat(form.dailyRateRegular),
      })
      addToast(`Proyecto ${project.folio} creado`, 'success')
      navigate(`/proyectos/${project.id}`)
    } catch {
      addToast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/proyectos')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Input label="Nombre del Proyecto" required value={form.name} onChange={set('name')} error={errors.name} placeholder="Ej. Residencial Los Pinos" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Cliente" value={form.client} onChange={set('client')} placeholder="Nombre del cliente" />
            <Input label="Ubicación" value={form.location} onChange={set('location')} placeholder="Ciudad, Estado" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fecha de Inicio" type="date" required value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
            <Input label="Fecha de Fin (estimada)" type="date" value={form.endDate} onChange={set('endDate')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Estado" options={STATUS_OPTS} value={form.status} onChange={set('status')} />
            <Input label="Salario Diario Base (MXN)" type="number" min="0" step="0.01" prefix="$" value={form.dailyRateRegular} onChange={set('dailyRateRegular')} error={errors.dailyRateRegular} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Detalles adicionales del proyecto..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : 'Crear Proyecto'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/proyectos')}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
