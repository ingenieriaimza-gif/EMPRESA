import { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses.js'
import { useProjects } from '../../hooks/useProjects.js'
import { useAppContext } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { toISODate, formatDate, getMonthRange } from '../../utils/dateHelpers.js'
import { formatCurrency } from '../../utils/payroll.js'
import { exportToCsv } from '../../utils/exportCsv.js'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CATEGORIES = ['Materiales', 'Herramienta', 'Combustible', 'Viáticos', 'Mano de obra', 'Otro']
const CATEGORY_OPTS = CATEGORIES.map((c) => ({ value: c, label: c }))
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280']

export default function ExpenseList() {
  const now = new Date()
  const defaultPeriod = getMonthRange(now.getFullYear(), now.getMonth() + 1)
  const { addToast } = useAppContext()
  const { projects } = useProjects()
  const [projectFilter, setProjectFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState(defaultPeriod.start)
  const [endDate, setEndDate] = useState(defaultPeriod.end)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { expenses, loading, grandTotal, totalByCategory, addExpense, deleteExpense } = useExpenses({
    projectId: projectFilter || undefined,
    category: categoryFilter || undefined,
    startDate,
    endDate,
  })

  const [form, setForm] = useState({
    projectId: '',
    date: toISODate(),
    category: 'Materiales',
    description: '',
    amount: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validateForm = () => {
    const errs = {}
    if (!form.projectId) errs.projectId = 'Selecciona un proyecto'
    if (!form.description.trim()) errs.description = 'Descripción requerida'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = 'Monto inválido'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    try {
      await addExpense(form)
      addToast('Gasto registrado', 'success')
      setShowForm(false)
      setForm({ projectId: '', date: toISODate(), category: 'Materiales', description: '', amount: '' })
    } catch { addToast('Error al guardar', 'error') }
  }

  const handleDelete = async () => {
    try {
      await deleteExpense(deleteTarget.id)
      addToast('Gasto eliminado', 'success')
    } catch { addToast('Error al eliminar', 'error') }
    setDeleteTarget(null)
  }

  const handleExport = () => {
    exportToCsv('gastos.csv', expenses, [
      { label: 'Fecha', key: 'date', accessor: (r) => formatDate(r.date) },
      { label: 'Proyecto', key: 'projectId', accessor: (r) => projects.find(p => p.id === r.projectId)?.folio || '' },
      { label: 'Categoría', key: 'category' },
      { label: 'Descripción', key: 'description' },
      { label: 'Monto', key: 'amount' },
    ])
  }

  const pieData = Object.entries(totalByCategory).map(([name, value]) => ({ name, value }))
  const projectOpts = projects.map((p) => ({ value: p.id, label: `${p.folio} — ${p.name}` }))

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total: <strong>{formatCurrency(grandTotal)}</strong></p>
        </div>
        <div className="flex gap-2">
          {expenses.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los proyectos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.folio} — {p.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {pieData.length > 0 && (
        <Card title="Distribución por Categoría" className="mb-5">
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {expenses.length === 0 ? (
        <EmptyState icon="💸" title="Sin gastos" description="Registra los gastos del proyecto" action={() => setShowForm(true)} actionLabel="Agregar Gasto" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Proyecto</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Categoría</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Descripción</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Monto</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-xs text-blue-700 font-mono hidden md:table-cell">{projects.find(p => p.id === e.projectId)?.folio || '—'}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{e.category}</span></td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{e.description}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(e)}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="px-4 py-3 text-right text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo Gasto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Proyecto" required options={projectOpts} placeholder="Seleccionar proyecto..." value={form.projectId} onChange={set('projectId')} error={formErrors.projectId} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha" type="date" value={form.date} onChange={set('date')} />
            <Select label="Categoría" options={CATEGORY_OPTS} value={form.category} onChange={set('category')} />
          </div>
          <Input label="Descripción" required value={form.description} onChange={set('description')} error={formErrors.description} placeholder="Ej. Cemento Portland 50 sacos" />
          <Input label="Monto" type="number" min="0" step="0.01" prefix="$" required value={form.amount} onChange={set('amount')} error={formErrors.amount} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Guardar Gasto</Button>
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar Gasto">
        <p className="text-gray-600 mb-6">¿Eliminar el gasto <strong>{deleteTarget?.description}</strong> por <strong>{formatCurrency(deleteTarget?.amount)}</strong>?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
