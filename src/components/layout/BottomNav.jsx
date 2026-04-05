import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Inicio', icon: '📊', end: true },
  { to: '/proyectos', label: 'Proyectos', icon: '🏗️' },
  { to: '/bitacora', label: 'Bitácora', icon: '📋' },
  { to: '/gastos', label: 'Gastos', icon: '💸' },
  { to: '/nomina', label: 'Nómina', icon: '💰' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
      {nav.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 transition-colors ${
              isActive ? 'text-blue-700 font-semibold' : 'text-gray-500'
            }`
          }
        >
          <span className="text-lg leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
