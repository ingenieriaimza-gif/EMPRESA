const colors = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-700',
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-slate-100 text-slate-700',
  inactive: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700',
}

const labels = {
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  open: 'Abierto',
  closed: 'Cerrado',
  inactive: 'Inactivo',
}

export default function Badge({ status, label, className = '' }) {
  const colorClass = colors[status] || colors.default
  const text = label || labels[status] || status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {text}
    </span>
  )
}
