import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import EvalDesign from './EvalDesign'
import EvalOperation from './EvalOperation'
import EvalView from './EvalView'
import EvalGrading from './EvalGrading'
import EvalResult from './EvalResult'
import GoalRegister from './employee/GoalRegister'
import SelfEval from './employee/SelfEval'
import PeerEvalInput from './employee/PeerEvalInput'
import MyResult from './employee/MyResult'
import AppealRequest from './employee/AppealRequest'
import TeamStatus from './manager/TeamStatus'
import GoalApprove from './manager/GoalApprove'
import AchievementReview from './manager/AchievementReview'
import TeamEval from './manager/TeamEval'

const PERSONAL_ITEMS = [
  { label: '목표 등록', path: '/eval/employee/goal' },
  { label: '자기평가', path: '/eval/employee/self' },
  { label: '동료평가', path: '/eval/employee/peer' },
  { label: '내 평가결과', path: '/eval/employee/result' },
  { label: '이의신청', path: '/eval/employee/appeal' },
]

const MANAGER_ITEMS = [
  { label: '팀 현황', path: '/eval/manager/status' },
  { label: '목표 승인', path: '/eval/manager/goal-approve' },
  { label: '달성도 검토', path: '/eval/manager/achievement' },
  { label: '팀원 평가', path: '/eval/manager/eval' },
]

const ADMIN_ITEMS = [
  { label: '평가 설계', path: '/eval/design' },
  { label: '평가 운영', path: '/eval/operation' },
  { label: '평가 조회', path: '/eval/view' },
  { label: '등급 산정/보정', path: '/eval/grading' },
  { label: '평가 결과 처리', path: '/eval/result' },
]

function MenuSection({ title, items, currentPath, onNavigate }: {
  title: string; items: { label: string; path: string }[]; currentPath: string; onNavigate: (path: string) => void
}) {
  return (
    <div>
      <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase">{title}</div>
      {items.map(item => {
        const isActive = currentPath === item.path
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors ${
              isActive
                ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default function EvalLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">성과관리</h2>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto">
          <MenuSection title="개인" items={PERSONAL_ITEMS} currentPath={currentPath} onNavigate={navigate} />
          <MenuSection title="팀장" items={MANAGER_ITEMS} currentPath={currentPath} onNavigate={navigate} />
          <MenuSection title="관리" items={ADMIN_ITEMS} currentPath={currentPath} onNavigate={navigate} />
        </nav>
      </div>

      {/* 콘텐츠 */}
      <Routes>
        <Route path="employee/goal" element={<GoalRegister />} />
        <Route path="employee/self" element={<SelfEval />} />
        <Route path="employee/peer" element={<PeerEvalInput />} />
        <Route path="employee/result" element={<MyResult />} />
        <Route path="employee/appeal" element={<AppealRequest />} />
        <Route path="manager/status" element={<TeamStatus />} />
        <Route path="manager/goal-approve" element={<GoalApprove />} />
        <Route path="manager/achievement" element={<AchievementReview />} />
        <Route path="manager/eval" element={<TeamEval />} />
        <Route path="design" element={<EvalDesign />} />
        <Route path="operation" element={<EvalOperation />} />
        <Route path="view" element={<EvalView />} />
        <Route path="grading" element={<EvalGrading />} />
        <Route path="result" element={<EvalResult />} />
        <Route path="*" element={<GoalRegister />} />
      </Routes>
    </div>
  )
}
