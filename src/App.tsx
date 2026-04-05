import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
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
import HRAdminPage from './pages/hr-admin/HRAdminPage'
import GoalRegister from './pages/eval/employee/GoalRegister'
import SelfEval from './pages/eval/employee/SelfEval'
import PeerEvalInput from './pages/eval/employee/PeerEvalInput'
import MyResult from './pages/eval/employee/MyResult'
import AppealRequest from './pages/eval/employee/AppealRequest'
import TeamStatus from './pages/eval/manager/TeamStatus'
import GoalApprove from './pages/eval/manager/GoalApprove'
import AchievementReview from './pages/eval/manager/AchievementReview'
import TeamEval from './pages/eval/manager/TeamEval'
import EvalDesign from './pages/eval/EvalDesign'
import EvalOperation from './pages/eval/EvalOperation'
import EvalView from './pages/eval/EvalView'
import EvalGrading from './pages/eval/EvalGrading'
import EvalResult from './pages/eval/EvalResult'
import CertificateRequest from './pages/certificate/CertificateRequest'
import EmployeeList from './pages/hr/EmployeeList'
import EmployeeRegister from './pages/hr/EmployeeRegister'
import EmployeeDetail from './pages/hr/EmployeeDetail'
import EmployeeEdit from './pages/hr/EmployeeEdit'
import EmployeeRetire from './pages/hr/EmployeeRetire'
import SalaryContract from './pages/hr/SalaryContract'
import Certificate from './pages/hr/Certificate'
import WorkforceStatus from './pages/hr/WorkforceStatus'
import RetirementManagement from './pages/hr/RetirementManagement'
import RetirementDetail from './pages/hr/RetirementDetail'
import RetirementEdit from './pages/hr/RetirementEdit'
import PersonnelAppointment from './pages/hr/PersonnelAppointment'
import PermissionManagement from './pages/hr/PermissionManagement'
import AttendancePage from './pages/attendance/AttendancePage'
import MessengerPanel from './components/messenger/MessengerPanel'
import PayrollLayout from './pages/payroll/PayrollLayout'

function MainLayout() {
  const { isHRAdmin, isHRSuperAdmin } = useAuth()
  const navigate = useNavigate()

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
            <Route path="/certificate" element={<CertificateRequest />} />
            <Route path="/eval/employee/goal" element={<GoalRegister />} />
            <Route path="/eval/employee/self" element={<SelfEval />} />
            <Route path="/eval/employee/peer" element={<PeerEvalInput />} />
            <Route path="/eval/employee/result" element={<MyResult />} />
            <Route path="/eval/employee/appeal" element={<AppealRequest />} />
            <Route path="/eval/manager/status" element={<TeamStatus />} />
            <Route path="/eval/manager/goal-approve" element={<GoalApprove />} />
            <Route path="/eval/manager/achievement" element={<AchievementReview />} />
            <Route path="/eval/manager/eval" element={<TeamEval />} />
            <Route path="/eval/design" element={<EvalDesign />} />
            <Route path="/eval/operation" element={<EvalOperation />} />
            <Route path="/eval/view" element={<EvalView />} />
            <Route path="/eval/grading" element={<EvalGrading />} />
            <Route path="/eval/result" element={<EvalResult />} />
            <Route path="/hr/list" element={<EmployeeList />} />
            <Route path="/hr/register" element={<EmployeeRegister />} />
            <Route path="/hr/employee/register" element={<EmployeeRegister />} />
            <Route path="/hr/employee/:id" element={<EmployeeDetail />} />
            <Route path="/hr/employee/:id/edit" element={<EmployeeEdit />} />
            <Route path="/hr/employee/:id/retire" element={<EmployeeRetire />} />
            <Route path="/hr/salary-contract" element={<SalaryContract />} />
            <Route path="/hr/certificate" element={<Certificate />} />
            <Route path="/hr/workforce" element={<WorkforceStatus />} />
            <Route path="/hr/retirement" element={<RetirementManagement />} />
            <Route path="/hr/retirement/:id" element={<RetirementDetail />} />
            <Route path="/hr/retirement/:id/edit" element={<RetirementEdit />} />
            <Route path="/hr/appointment" element={<PersonnelAppointment />} />
            <Route path="/hr/permission" element={<PermissionManagement />} />
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
        onVerified={() => navigate('/hr-admin')}
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
