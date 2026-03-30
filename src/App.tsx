import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/calendar/CalendarPage'
import SalaryPage from './pages/salary/SalaryPage'
import Approval from './pages/Approval'
import MenuSettingsModal from './components/modals/MenuSettingsModal'

function App() {
  const isHRAdmin = true

  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false)
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({
    dashboard: true,
    board: true,
    approval: true,
    attendance: true,
    performance: true,
    salary: true,
    mail: true,
    org: true,
  })

  const toggleMenuVisibility = (key: string) => {
    setMenuVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isHRAdmin={isHRAdmin}
          menuVisibility={menuVisibility}
          onOpenMenuSettings={() => setMenuSettingsOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/salary" element={<SalaryPage />} />
          </Routes>
        </main>
      </div>
      <MenuSettingsModal
        isOpen={menuSettingsOpen}
        onClose={() => setMenuSettingsOpen(false)}
        menuVisibility={menuVisibility}
        onToggle={toggleMenuVisibility}
      />
    </div>
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isHRAdmin={isHRAdmin}
            menuVisibility={menuVisibility}
            onOpenMenuSettings={() => setMenuSettingsOpen(true)}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/approval" element={<Approval />} />
            </Routes>
          </main>
        </div>
        <MenuSettingsModal
          isOpen={menuSettingsOpen}
          onClose={() => setMenuSettingsOpen(false)}
          menuVisibility={menuVisibility}
          onToggle={toggleMenuVisibility}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
