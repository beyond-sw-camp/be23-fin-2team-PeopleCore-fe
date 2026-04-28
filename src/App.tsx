import { useState, useEffect, useMemo, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HrAdminSessionProvider, useHrAdminSession, formatRemaining } from './contexts/HrAdminSessionContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import { DEFAULT_MENU_ORDER, type MenuKey } from './components/layout/sidebarMenu'
import {
  fetchMyMenuSettings,
  updateMyMenuSettings,
  recordRecentMenu,
  resolveMenuKeyFromLocation,
  MENU_CODE_TO_KEY,
  MENU_KEY_TO_CODE,
} from './api/menuSetting'
import type { MenuSettingItem } from './api/menuSetting'
import DashboardPage from './pages/dashboard/DashboardPage'
import CalendarPage from './pages/calendar/CalendarPage'
import SalaryPage from './pages/salary/SalaryPage'
import ApprovalPage from './pages/approval/ApprovalPage'
import ApprovalModalHost from './components/approval/ApprovalModalHost'
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
import EvalAdminPage from './pages/eval-admin/EvalAdminPage'
import HRLayout from './pages/hr/HRLayout'
import AttendancePage from './pages/attendance/AttendancePage'
import AttendanceAdminPage from './pages/attendance-admin/AttendanceAdminPage'
import MessengerPanel from './components/messenger/MessengerPanel'
import PayrollLayout from './pages/payroll/PayrollLayout'
import GlobalAlertHost, { installGlobalAlert } from './components/common/GlobalAlertHost'

installGlobalAlert()

function MainLayout() {
  const { isHRAdmin, isHRSuperAdmin } = useAuth()
  const location = useLocation()
  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false)
  const [orgChartOpen, setOrgChartOpen] = useState(false)
  const [orgChartInitial, setOrgChartInitial] = useState<{ empId?: string; deptId?: string }>({})
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [messengerTarget, setMessengerTarget] = useState<{ userId: string; userName: string } | null>(null)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [menuSettings, setMenuSettings] = useState<MenuSettingItem[] | null>(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    fetchMyMenuSettings()
      .then(setMenuSettings)
      .catch(err => {
        console.warn('[menu-settings] 로드 실패 - 기본값 사용:', err)
      })
  }, [])

  // 라우팅 시점마다 최근 접속 메뉴 기록 (BE 가 DASHBOARD/권한 없는 코드는 자체 무시)
  useEffect(() => {
    const key = resolveMenuKeyFromLocation(location.pathname, location.search)
    if (!key) return
    const code = MENU_KEY_TO_CODE[key]
    if (code) recordRecentMenu(code)
  }, [location.pathname, location.search])

  const { menuVisibility, menuOrder, toggleableKeys } = useMemo(() => {
    if (!menuSettings) {
      return {
        menuVisibility: { approval: true, attendance: true, leave: true } as Record<string, boolean>,
        menuOrder: DEFAULT_MENU_ORDER,
        toggleableKeys: new Set<MenuKey>(['approval', 'attendance', 'leave']),
      }
    }
    const sorted = [...menuSettings].sort((a, b) => a.sortOrder - b.sortOrder)
    const vis: Record<string, boolean> = {}
    const order: MenuKey[] = []
    const toggleable = new Set<MenuKey>()
    sorted.forEach(m => {
      const key = MENU_CODE_TO_KEY[m.menuCode]
      if (!key) return
      vis[key] = m.isVisible
      order.push(key)
      if (m.toggleable) toggleable.add(key)
    })
    return { menuVisibility: vis, menuOrder: order, toggleableKeys: toggleable }
  }, [menuSettings])

  const toggleMenuVisibility = (key: string) => {
    const code = MENU_KEY_TO_CODE[key as MenuKey]
    if (!code) return
    setMenuSettings(prev => {
      if (!prev) return prev
      return prev.map(m => (m.menuCode === code ? { ...m, isVisible: !m.isVisible } : m))
    })
    dirtyRef.current = true
  }

  const handleReorder = (next: MenuKey[]) => {
    setMenuSettings(prev => {
      if (!prev) return prev
      const byCode = new Map(prev.map(m => [m.menuCode, m]))
      const result: MenuSettingItem[] = []
      next.forEach((key, idx) => {
        const code = MENU_KEY_TO_CODE[key]
        const item = byCode.get(code)
        if (item) {
          result.push({ ...item, sortOrder: idx + 1 })
          byCode.delete(code)
        }
      })
      let tail = result.length
      byCode.forEach(item => {
        tail += 1
        result.push({ ...item, sortOrder: tail })
      })
      return result
    })
    dirtyRef.current = true
  }

  const handleMenuSettingsClose = async () => {
    setMenuSettingsOpen(false)
    if (!dirtyRef.current || !menuSettings) return
    dirtyRef.current = false
    try {
      const payload = menuSettings.map(m => ({
        menuCode: m.menuCode,
        isVisible: m.isVisible,
        sortOrder: m.sortOrder,
      }))
      const updated = await updateMyMenuSettings(payload)
      setMenuSettings(updated)
    } catch (err) {
      console.error('[menu-settings] 저장 실패:', err)
    }
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
          menuOrder={menuOrder}
          serverControlled={menuSettings !== null}
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
            <Route path="/attendance-admin" element={<AttendanceAdminPage />} />
            <Route path="/org-management/*" element={<OrgManagementPage />} />

            <Route path="/eval/*" element={<EvalLayout />} />
            <Route path="/eval-admin" element={<EvalAdminPage />} />
            <Route path="/hr/*" element={<HRLayout />} />
            <Route path="/payroll/*" element={<PayrollLayout />} />
          </Routes>
        </main>
      </div>
      <MenuSettingsModal
        isOpen={menuSettingsOpen}
        onClose={handleMenuSettingsClose}
        menuVisibility={menuVisibility}
        onToggle={toggleMenuVisibility}
        isHRAdmin={isHRAdmin}
        menuOrder={menuOrder}
        onReorder={handleReorder}
        serverControlled={menuSettings !== null}
        toggleableKeys={toggleableKeys}
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
        <ApprovalModalHost />
        </HrAdminSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
