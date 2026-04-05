import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/proyectos', label: 'Proyectos', icon: '🏗️' },
  { to: '/trabajadores', label: 'Trabajadores', icon: '👷' },
  { to: '/bitacora', label: 'Bitácora', icon: '📋' },
  { to: '/horas-extra', label: 'Horas Extra', icon: '⏱️' },
  { to: '/gastos', label: 'Gastos', icon: '💸' },
  { to: '/nomina', label: 'Nómina', icon: '💰' },
]

export default function Sidebar({ onClose }) {
  return (
    <aside className="flex flex-col w-64 bg-blue-900 text-white h-full">
      <div className="px-6 py-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-lg font-bold">E</div>
          <div>
            <p className="font-bold text-sm leading-tight">Empresa</p>
            <p className="text-xs text-blue-300">Gestión de Obras</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-blue-800">
        <OnlineIndicator />
      </div>
    </aside>
  )
}

function OnlineIndicator() {
  const [online, setOnline] = React.useState(navigator.onLine)
  React.useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return (
    <div className="flex items-center gap-2 text-xs text-blue-300">
      <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`} />
      {online ? 'En línea' : 'Sin conexión'}
    </div>
  )
}

import React from 'react'
