import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import GoalRegister from './employee/GoalRegister'
import SelfEval from './employee/SelfEval'
import MyResult from './employee/MyResult'
import AppealRequest from './employee/AppealRequest'
import GoalApprove from './manager/GoalApprove'
import AchievementReview from './manager/AchievementReview'
import TeamEval from './manager/TeamEval'
import TeamEvalResult from './manager/TeamEvalResult'
import StageGate from '../../components/eval/StageGate'
import { ActiveStagesProvider } from '../../hooks/useActiveStages'
import { useAuth } from '../../contexts/AuthContext'

interface MenuChild {
  label: string
  path: string
  badge?: string
}

interface MenuItem {
  label: string
  path: string
  children?: MenuChild[]
}

// 사이드바 섹션 — 역할별 표시/숨김 정책
// - 개인: 모든 로그인 사용자. 단 평가자 지정자는 시즌 스냅샷에서 평가 대상이 아니라
//   목표 등록 / 자기평가는 숨기고 "내 평가결과" (과거 시즌 본인 결과 조회) 만 노출.
// - 팀장: evaluatorRoleApi.me().evaluator === true
// 관리(평가 설계/등급/결과)는 EvalAdminPage(/eval-admin)으로 이동.

const PERSONAL_ITEMS: MenuItem[] = [
  { label: '목표 등록', path: '/eval/employee/goal' },
  { label: '자기평가', path: '/eval/employee/self' },
  { label: '내 평가결과', path: '/eval/employee/result' },
  // { label: '이의신청', path: '/eval/employee/appeal' },  // 이의신청 기능 임시 숨김
]

const EVALUATOR_HIDDEN_PERSONAL_PATHS = new Set([
  '/eval/employee/goal',
  '/eval/employee/self',
])

const MANAGER_ITEMS: MenuItem[] = [
  { label: '목표 승인', path: '/eval/manager/goal-approve' },
  { label: '달성도 검토', path: '/eval/manager/achievement' },
  { label: '팀원 평가', path: '/eval/manager/eval' },
  { label: '팀 결과', path: '/eval/manager/team-result' },
]

function MenuSection({
  title, items, currentPath, onNavigate,
}: {
  title: string
  items: MenuItem[]
  currentPath: string
  onNavigate: (path: string) => void
}) {
  return (
    <div>
      <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase">{title}</div>
      {items.map(item => {
        const hasChildren = item.children && item.children.length > 0
        const isActive = !hasChildren && currentPath === item.path
        const isParentActive = hasChildren && currentPath.startsWith(item.path)

        return (
          <div key={item.path}>
            <div
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] flex items-center justify-between gap-1 ${
                isActive
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE] cursor-pointer'
                  : isParentActive
                  ? 'text-[#1D9E75] font-semibold'
                  : hasChildren
                  ? 'text-[#5a6b62] font-semibold'
                  : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75] cursor-pointer'
              }`}
              onClick={() => {
                if (hasChildren) return
                onNavigate(item.path)
              }}
            >
              <span>{item.label}</span>
            </div>

            {hasChildren && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                {item.children!.map(child => {
                  const isChildActive = currentPath === child.path
                  return (
                    <button
                      key={child.path}
                      onClick={() => onNavigate(child.path)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[12px] transition-colors flex items-center justify-between gap-1 ${
                        isChildActive
                          ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                          : 'text-gray-600 hover:bg-[#f2faf6] hover:text-[#1D9E75]'
                      }`}
                    >
                      <span>{child.label}</span>
                      {child.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#eaf6f0] text-[#1D9E75] font-medium whitespace-nowrap">
                          {child.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EvalLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { isEvaluator } = useAuth()

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">성과평가</h2>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto">
          <MenuSection
            title="개인"
            items={isEvaluator
              ? PERSONAL_ITEMS.filter(item => !EVALUATOR_HIDDEN_PERSONAL_PATHS.has(item.path))
              : PERSONAL_ITEMS}
            currentPath={currentPath}
            onNavigate={navigate}
          />
          {isEvaluator && (
            <MenuSection title="팀장" items={MANAGER_ITEMS} currentPath={currentPath} onNavigate={navigate} />
          )}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <Routes>
        <Route
          path="employee/goal"
          element={isEvaluator
            ? <Navigate to="/eval/employee/result" replace />
            : <StageGate requires="GOAL_ENTRY"><GoalRegister /></StageGate>}
        />
        <Route
          path="employee/self"
          element={isEvaluator
            ? <Navigate to="/eval/employee/result" replace />
            : <StageGate requires="SELF_EVAL"><SelfEval /></StageGate>}
        />
        <Route path="employee/result" element={<MyResult />} />
        <Route path="employee/appeal" element={<AppealRequest />} />
        <Route path="manager/goal-approve" element={<StageGate requires="GOAL_ENTRY"><GoalApprove /></StageGate>} />
        <Route path="manager/achievement" element={<StageGate requires="SELF_EVAL"><AchievementReview /></StageGate>} />
        <Route path="manager/eval" element={<StageGate requires="MANAGER_EVAL"><TeamEval /></StageGate>} />
        <Route path="manager/team-result" element={<TeamEvalResult />} />
        <Route
          path="*"
          element={isEvaluator
            ? <Navigate to="/eval/employee/result" replace />
            : <StageGate requires="GOAL_ENTRY"><GoalRegister /></StageGate>}
        />
      </Routes>
    </div>
  )
}

export default function EvalLayout() {
  return (
    <ActiveStagesProvider>
      <EvalLayoutInner />
    </ActiveStagesProvider>
  )
}
