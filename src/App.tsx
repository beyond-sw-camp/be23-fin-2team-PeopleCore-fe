import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import DashboardPage from './pages/dashboard/DashboardPage'
import CalendarPage from './pages/calendar/CalendarPage'
import SalaryPage from './pages/salary/SalaryPage'
import ApprovalPage from './pages/approval/ApprovalPage'
import BoardPage from './pages/board/BoardPage'
import OrgChartPage from './pages/org/OrgChartPage'
import OrgChartModal from './components/modals/OrgChartModal'
import MenuSettingsModal from './components/modals/MenuSettingsModal'
import HRAdminPinModal from './components/modals/HRAdminPinModal'
import LoginPage from './pages/auth/LoginPage'
import FindEmailPage from './pages/auth/FindEmailPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import MessengerPage from './pages/messenger/MessengerPage'
import DrivePage from './pages/drive/DrivePage'
import OrgManagementPage from './pages/org-management/OrgManagementPage'
import HRAdminPage from './pages/hr-admin/HRAdminPage'
import EvalLayout from './pages/eval/EvalLayout'
import HRLayout from './pages/hr/HRLayout'
import AttendancePage from './pages/attendance/AttendancePage'
import MessengerPanel from './components/messenger/MessengerPanel'
import PayrollLayout from './pages/payroll/PayrollLayout'

function MainLayout() {
  const { isHRAdmin, isHRSuperAdmin } = useAuth()
  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false)
  const [orgChartOpen, setOrgChartOpen] = useState(false)
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [messengerTarget, setMessengerTarget] = useState<{ userId: string; userName: string } | null>(null)
  const [pinModalOpen, setPinModalOpen] = useState(false)
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
      <Header onOpenMessenger={() => { setMessengerTarget(null); setMessengerOpen(true) }} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isHRAdmin={isHRAdmin}
          isHRSuperAdmin={isHRSuperAdmin}
          menuVisibility={menuVisibility}
          onOpenMenuSettings={() => setMenuSettingsOpen(true)}
          onOpenOrgChart={() => setOrgChartOpen(true)}
          onOpenHRAdmin={() => setPinModalOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/salary" element={<SalaryPage />} />
            <Route path="/approval" element={<ApprovalPage />} />
            <Route path="/org" element={<OrgChartPage />} />
            <Route path="/drive" element={<DrivePage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/org-management/*" element={<OrgManagementPage />} />

            <Route path="/eval/*" element={<EvalLayout />} />
            <Route path="/hr/*" element={<HRLayout />} />
            <Route path="/payroll/*" element={<PayrollLayout />} />
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
        onOpenMessenger={(userId, userName) => { setMessengerTarget({ userId, userName }); setMessengerOpen(true) }}
      />
      <MessengerPanel
        isOpen={messengerOpen}
        onClose={() => { setMessengerOpen(false); setMessengerTarget(null) }}
        initialUserId={messengerTarget?.userId}
        initialUserName={messengerTarget?.userName}
      />
      <HRAdminPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onVerified={() => { window.location.href = '/hr-admin' }}
      />
    </div>
  )
}

function HRAdminLayout() {
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [messengerTarget, setMessengerTarget] = useState<{ userId: string; userName: string } | null>(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onOpenMessenger={() => { setMessengerTarget(null); setMessengerOpen(true) }} />
      <div className="flex flex-1 overflow-hidden">
        <HRAdminPage />
      </div>
      <MessengerPanel
        isOpen={messengerOpen}
        onClose={() => { setMessengerOpen(false); setMessengerTarget(null) }}
        initialUserId={messengerTarget?.userId}
        initialUserName={messengerTarget?.userName}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/find-email" element={<FindEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/hr-admin" element={<ProtectedRoute><HRAdminLayout /></ProtectedRoute>} />
          <Route path="/messenger" element={<ProtectedRoute><MessengerPage /></ProtectedRoute>} />
          <Route path="/dashboard/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
          <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
