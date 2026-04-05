import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Dashboard',
  '/proyectos': 'Proyectos',
  '/trabajadores': 'Trabajadores',
  '/bitacora': 'Bitácora',
  '/horas-extra': 'Horas Extra',
  '/gastos': 'Gastos',
  '/nomina': 'Nómina',
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = Object.entries(titles)
    .filter(([path]) => pathname.startsWith(path) && path !== '/')
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
    || (pathname === '/' ? 'Dashboard' : '')

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 md:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="font-semibold text-gray-900 flex-1">{title}</h1>
      <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white text-xs font-bold">E</div>
    </header>
  )
}
