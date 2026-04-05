import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import { useWorkers } from '../hooks/useWorkers.js'
import { entriesRepo } from '../db/repositories/index.js'
import { expensesRepo } from '../db/repositories/index.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { toISODate, formatDate, getLast7Days, getWeekRange, getMonthRange } from '../utils/dateHelpers.js'
import { formatCurrency } from '../utils/payroll.js'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const { workers, loading: workersLoading } = useWorkers()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const [allEntries, allExpenses] = await Promise.all([
        entriesRepo.getAll(),
        expensesRepo.getAll(),
      ])
      const today = toISODate()
      const week = getWeekRange()
      const month = getMonthRange(new Date().getFullYear(), new Date().getMonth() + 1)
      const last7 = getLast7Days()

      const todayEntries = allEntries.filter((e) => e.date === today)
      const openToday = todayEntries.filter((e) => e.status === 'open')
      const weekOT = allEntries
        .filter((e) => e.date >= week.start && e.date <= week.end && e.status === 'closed')
        .reduce((s, e) => s + e.overtimeHours, 0)
      const monthExpenses = allExpenses
        .filter((e) => e.date >= month.start && e.date <= month.end)
        .reduce((s, e) => s + e.amount, 0)

      // Last 7 days attendance chart
      const chartData = last7.map((date) => ({
        date: formatDate(date).slice(0, 5), // DD/MM
        trabajadores: allEntries.filter((e) => e.date === date && e.status === 'closed').length,
      }))

      // Recent entries (last 8)
      const recent = [...allEntries]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8)

      setStats({ todayCount: todayEntries.length, openToday: openToday.length, weekOT, monthExpenses, chartData, recent, allEntries })
      setStatsLoading(false)
    }
    loadStats()
  }, [])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const activeWorkers = workers.filter((w) => w.status === 'active')

  if (projectsLoading || workersLoading || statsLoading) return <Spinner className="py-20" />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{formatDate(toISODate())}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard icon="🏗️" label="Proyectos activos" value={activeProjects.length} color="blue" onClick={() => navigate('/proyectos')} />
        <KPICard icon="👷" label="Trabajadores activos" value={activeWorkers.length} color="green" onClick={() => navigate('/trabajadores')} />
        <KPICard icon="⏱️" label="Hrs. extra esta semana" value={`${stats.weekOT.toFixed(1)}h`} color="amber" onClick={() => navigate('/horas-extra')} />
        <KPICard icon="💸" label="Gastos este mes" value={formatCurrency(stats.monthExpenses)} color="red" onClick={() => navigate('/gastos')} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {activeProjects.length > 0 && (
          <Button onClick={() => navigate(`/bitacora/${activeProjects[0].id}`)}>
            📋 Registrar asistencia
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate('/gastos')}>
          💸 Nuevo gasto
        </Button>
        <Button variant="secondary" onClick={() => navigate('/proyectos/nuevo')}>
          🏗️ Nuevo proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Attendance chart */}
        <Card title="Asistencia — últimos 7 días">
          <div className="h-48 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="trabajadores" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Trabajadores" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Active projects */}
        <Card title="Proyectos activos" action={<Button size="sm" variant="ghost" onClick={() => navigate('/proyectos')}>Ver todos</Button>}>
          {activeProjects.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Sin proyectos activos</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeProjects.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/proyectos/${p.id}`)}>
                  <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{p.folio}</span>
                  <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                  <Badge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      {stats.recent.length > 0 && (
        <Card title="Actividad reciente">
          <div className="divide-y divide-gray-50">
            {stats.recent.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.status === 'open' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{formatDate(e.date)} · {e.checkIn}{e.checkOut ? ` – ${e.checkOut}` : ' (abierto)'}</p>
                </div>
                <Badge status={e.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats.recent.length === 0 && activeProjects.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-4xl mb-4">🏗️</p>
          <p className="text-lg font-semibold text-gray-700 mb-2">Bienvenido a Empresa</p>
          <p className="text-sm text-gray-500 mb-5">Comienza creando tu primer proyecto de construcción</p>
          <Button onClick={() => navigate('/proyectos/nuevo')}>Crear primer proyecto</Button>
        </Card>
      )}
    </div>
  )
}

function KPICard({ icon, label, value, color, onClick }) {
  const colorClass = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }[color]
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
    >
      <p className="text-2xl mb-2">{icon}</p>
      <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
