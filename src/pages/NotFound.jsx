import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-7xl mb-4">🚧</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-500 mb-6">La ruta que buscas no existe</p>
      <Button onClick={() => navigate('/')}>Ir al Dashboard</Button>
    </div>
  )
}
