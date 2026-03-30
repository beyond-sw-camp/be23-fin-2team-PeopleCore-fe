import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import MenuSettingsModal from './components/modals/MenuSettingsModal'
import EmployeeList from './pages/hr/EmployeeList'
import EmployeeRegister from './pages/hr/EmployeeRegister'
import PermissionManagement from './pages/hr/PermissionManagement'
import PersonnelAppointment from './pages/hr/PersonnelAppointment'
import RetirementManagement from './pages/hr/RetirementManagement'
import SalaryContract from './pages/hr/SalaryContract'
import Certificate from './pages/hr/Certificate'
import WorkforceStatus from './pages/hr/WorkforceStatus'
import EvalDesign from './pages/eval/EvalDesign'
import EvalOperation from './pages/eval/EvalOperation'
import EvalView from './pages/eval/EvalView'
import EvalGrading from './pages/eval/EvalGrading'
import EvalResult from './pages/eval/EvalResult'
// 평가 설계
import SeasonCreate from './pages/eval/design/SeasonCreate'
import ItemWeightSetting from './pages/eval/design/ItemWeightSetting'
import TargetConfirmation from './pages/eval/design/TargetConfirmation'
import ForceDistribution from './pages/eval/design/ForceDistribution'
import PeerAssignment from './pages/eval/design/PeerAssignment'
// 평가 운영
import ScheduleNotice from './pages/eval/operation/ScheduleNotice'
import StageOpenClose from './pages/eval/operation/StageOpenClose'
import GoalStatus from './pages/eval/operation/GoalStatus'
import EvalInputMonitor from './pages/eval/operation/EvalInputMonitor'
import OverdueReminder from './pages/eval/operation/OverdueReminder'
// 평가 조회
import AllEvalList from './pages/eval/view/AllEvalList'
import MyEvalDetail from './pages/eval/view/MyEvalDetail'
import ManagerEvalView from './pages/eval/view/ManagerEvalView'
import PeerEvalView from './pages/eval/view/PeerEvalView'
// 등급 산정/보정
import GradeDraftAuto from './pages/eval/grading/GradeDraftAuto'
import DeptGradeDistribution from './pages/eval/grading/DeptGradeDistribution'
import GradeCalibration from './pages/eval/grading/GradeCalibration'
import GradeFinalLock from './pages/eval/grading/GradeFinalLock'
// 평가 결과 처리
import EvalResultView from './pages/eval/result/EvalResultView'
import SalaryBonusLink from './pages/eval/result/SalaryBonusLink'
import ResultBulkNotify from './pages/eval/result/ResultBulkNotify'
import AppealManagement from './pages/eval/result/AppealManagement'
import EvalReport from './pages/eval/result/EvalReport'
import YearlyHistory from './pages/eval/result/YearlyHistory'
// 성과관련(개인)
import GoalRegister from './pages/eval/employee/GoalRegister'
import SelfEval from './pages/eval/employee/SelfEval'
import PeerEvalInput from './pages/eval/employee/PeerEvalInput'
import MyResult from './pages/eval/employee/MyResult'
import AppealRequest from './pages/eval/employee/AppealRequest'
// 성과관련(팀장)
import GoalApprove from './pages/eval/manager/GoalApprove'
import AchievementReview from './pages/eval/manager/AchievementReview'
import TeamEval from './pages/eval/manager/TeamEval'
import TeamStatus from './pages/eval/manager/TeamStatus'

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
              <Route path="/hr/employee" element={<EmployeeList />} />
              <Route path="/hr/employee/register" element={<EmployeeRegister />} />
              <Route path="/hr/permission" element={<PermissionManagement />} />
              <Route path="/hr/appointment" element={<PersonnelAppointment />} />
              <Route path="/hr/retirement" element={<RetirementManagement />} />
              <Route path="/hr/salary-contract" element={<SalaryContract />} />
              <Route path="/hr/certificate" element={<Certificate />} />
              <Route path="/hr/workforce" element={<WorkforceStatus />} />
              <Route path="/eval/design" element={<EvalDesign />} />
              <Route path="/eval/operation" element={<EvalOperation />} />
              <Route path="/eval/view" element={<EvalView />} />
              <Route path="/eval/grading" element={<EvalGrading />} />
              <Route path="/eval/result" element={<EvalResult />} />
              {/* 평가 설계 */}
              <Route path="/eval/design/season-create" element={<SeasonCreate />} />
              <Route path="/eval/design/item-weight" element={<ItemWeightSetting />} />
              <Route path="/eval/design/target-confirm" element={<TargetConfirmation />} />
              <Route path="/eval/design/force-distribution" element={<ForceDistribution />} />
              <Route path="/eval/design/peer-assignment" element={<PeerAssignment />} />
              {/* 평가 운영 */}
              <Route path="/eval/operation/schedule-notice" element={<ScheduleNotice />} />
              <Route path="/eval/operation/stage-open-close" element={<StageOpenClose />} />
              <Route path="/eval/operation/goal-status" element={<GoalStatus />} />
              <Route path="/eval/operation/input-monitor" element={<EvalInputMonitor />} />
              <Route path="/eval/operation/overdue-reminder" element={<OverdueReminder />} />
              {/* 평가 조회 */}
              <Route path="/eval/view/all" element={<AllEvalList />} />
              <Route path="/eval/view/my" element={<MyEvalDetail />} />
              <Route path="/eval/view/manager" element={<ManagerEvalView />} />
              <Route path="/eval/view/peer" element={<PeerEvalView />} />
              {/* 등급 산정/보정 */}
              <Route path="/eval/grading/grade-draft" element={<GradeDraftAuto />} />
              <Route path="/eval/grading/dept-distribution" element={<DeptGradeDistribution />} />
              <Route path="/eval/grading/calibration" element={<GradeCalibration />} />
              <Route path="/eval/grading/final-lock" element={<GradeFinalLock />} />
              {/* 평가 결과 처리 */}
              <Route path="/eval/result/result-view" element={<EvalResultView />} />
              <Route path="/eval/result/salary-link" element={<SalaryBonusLink />} />
              <Route path="/eval/result/bulk-notify" element={<ResultBulkNotify />} />
              <Route path="/eval/result/appeal" element={<AppealManagement />} />
              <Route path="/eval/result/report" element={<EvalReport />} />
              <Route path="/eval/result/history" element={<YearlyHistory />} />
              {/* 성과관련(개인) */}
              <Route path="/eval/employee/goal-register" element={<GoalRegister />} />
              <Route path="/eval/employee/self-eval" element={<SelfEval />} />
              <Route path="/eval/employee/peer-eval" element={<PeerEvalInput />} />
              <Route path="/eval/employee/my-result" element={<MyResult />} />
              <Route path="/eval/employee/appeal" element={<AppealRequest />} />
              {/* 성과관련(팀장) */}
              <Route path="/eval/manager/goal-approve" element={<GoalApprove />} />
              <Route path="/eval/manager/achievement-review" element={<AchievementReview />} />
              <Route path="/eval/manager/team-eval" element={<TeamEval />} />
              <Route path="/eval/manager/team-status" element={<TeamStatus />} />
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
