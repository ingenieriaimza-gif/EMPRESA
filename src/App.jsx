import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import BottomNav from './components/layout/BottomNav.jsx'
import ToastContainer from './components/ui/Toast.jsx'

import Dashboard from './pages/Dashboard.jsx'
import ProjectList from './pages/projects/ProjectList.jsx'
import ProjectCreate from './pages/projects/ProjectCreate.jsx'
import ProjectDetail from './pages/projects/ProjectDetail.jsx'
import WorkerList from './pages/workers/WorkerList.jsx'
import WorkerDetail from './pages/workers/WorkerDetail.jsx'
import BitacoraList from './pages/bitacora/BitacoraList.jsx'
import BitacoraEntry from './pages/bitacora/BitacoraEntry.jsx'
import OvertimeDashboard from './pages/overtime/OvertimeDashboard.jsx'
import ExpenseList from './pages/expenses/ExpenseList.jsx'
import PayrollReport from './pages/payroll/PayrollReport.jsx'
import NotFound from './pages/NotFound.jsx'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="h-screen sticky top-0">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/proyectos" element={<ProjectList />} />
            <Route path="/proyectos/nuevo" element={<ProjectCreate />} />
            <Route path="/proyectos/:id" element={<ProjectDetail />} />
            <Route path="/trabajadores" element={<WorkerList />} />
            <Route path="/trabajadores/:id" element={<WorkerDetail />} />
            <Route path="/bitacora" element={<BitacoraList />} />
            <Route path="/bitacora/:projectId" element={<BitacoraEntry />} />
            <Route path="/horas-extra" element={<OvertimeDashboard />} />
            <Route path="/gastos" element={<ExpenseList />} />
            <Route path="/nomina" element={<PayrollReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  )
}
