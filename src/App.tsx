import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import DashboardPage from './pages/dashboard/DashboardPage'
import CalendarPage from './pages/calendar/CalendarPage'
import SalaryPage from './pages/salary/SalaryPage'
import ApprovalPage from './pages/approval/ApprovalPage'
import OrgChartPage from './pages/org/OrgChartPage'
import OrgChartModal from './components/modals/OrgChartModal'
import MenuSettingsModal from './components/modals/MenuSettingsModal'
import LoginPage from './pages/auth/LoginPage'
import FindEmailPage from './pages/auth/FindEmailPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import MessengerPage from './pages/messenger/MessengerPage'

function MainLayout() {
  const isHRAdmin = true

  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false)
  const [orgChartOpen, setOrgChartOpen] = useState(false)
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
          onOpenOrgChart={() => setOrgChartOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/salary" element={<SalaryPage />} />
            <Route path="/approval" element={<ApprovalPage />} />
            <Route path="/org" element={<OrgChartPage />} />
          </Routes>
        </main>
      </div>
      <MenuSettingsModal
        isOpen={menuSettingsOpen}
        onClose={() => setMenuSettingsOpen(false)}
        menuVisibility={menuVisibility}
        onToggle={toggleMenuVisibility}
      />
      <OrgChartModal
        isOpen={orgChartOpen}
        onClose={() => setOrgChartOpen(false)}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/find-email" element={<FindEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={<MainLayout />} />
        <Route path="/messenger" element={<MessengerPage />} />
        <Route path="/dashboard/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App