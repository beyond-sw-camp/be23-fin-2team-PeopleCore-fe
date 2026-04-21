import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HrAdminSessionProvider, useHrAdminSession, formatRemaining } from './contexts/HrAdminSessionContext'
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
import GlobalAlertHost, { installGlobalAlert } from './components/common/GlobalAlertHost'

installGlobalAlert()

function MainLayout() {
  const { isHRAdmin, isHRSuperAdmin } = useAuth()
  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false)
  const [orgChartOpen, setOrgChartOpen] = useState(false)
  const [orgChartInitial, setOrgChartInitial] = useState<{ empId?: string; deptId?: string }>({})
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

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ empId?: string; deptId?: string }>).detail || {}
      setOrgChartInitial(detail)
      setOrgChartOpen(true)
    }
    window.addEventListener('open-orgchart', handler)
    return () => window.removeEventListener('open-orgchart', handler)
  }, [])

  useEffect(() => {
    const handler = () => setPinModalOpen(true)
    window.addEventListener('open-hr-admin-pin', handler)
    return () => window.removeEventListener('open-hr-admin-pin', handler)
  }, [])

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
        onClose={() => { setOrgChartOpen(false); setOrgChartInitial({}) }}
        onOpenMessenger={(userId, userName) => { setMessengerTarget({ userId, userName }); setMessengerOpen(true) }}
        initialEmpId={orgChartInitial.empId}
        initialDeptId={orgChartInitial.deptId}
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

function HrAdminSessionBadge() {
  const { hasSession, remainingMs, clearSession } = useHrAdminSession()
  if (!hasSession) return null
  const warn = remainingMs < 60_000
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium ${
        warn
          ? 'border-red-300 bg-red-50 text-red-600'
          : 'border-[#1D9E75]/30 bg-[#f0faf6] text-[#1D9E75]'
      }`}
      title="인사통합 PIN 인증 세션"
    >
      <i className="fa-solid fa-shield-halved" />
      <span>인사통합</span>
      <span className="tabular-nums">· {formatRemaining(remainingMs)}</span>
      <button
        onClick={clearSession}
        className="ml-1 text-[10px] opacity-60 hover:opacity-100"
        title="세션 종료"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  )
}

function HRAdminLayout() {
  const navigate = useNavigate()
  const { hasSession } = useHrAdminSession()
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [messengerTarget, setMessengerTarget] = useState<{ userId: string; userName: string } | null>(null)

  useEffect(() => {
    if (!hasSession) {
      navigate('/', { replace: true })
    }
  }, [hasSession, navigate])

  if (!hasSession) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        onOpenMessenger={() => { setMessengerTarget(null); setMessengerOpen(true) }}
        extraRight={<HrAdminSessionBadge />}
      />
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
        <HrAdminSessionProvider>
        <GlobalAlertHost />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/find-email" element={<FindEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/hr-admin" element={<ProtectedRoute><HRAdminLayout /></ProtectedRoute>} />
          <Route path="/messenger" element={<ProtectedRoute><MessengerPage /></ProtectedRoute>} />
          <Route path="/dashboard/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
          <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
        </Routes>
        </HrAdminSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
