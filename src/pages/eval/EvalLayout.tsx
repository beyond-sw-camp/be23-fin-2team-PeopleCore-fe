import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import EvalDesign from './EvalDesign'
import EvalGrading from './EvalGrading'
import EvalResult from './EvalResult'
import GoalRegister from './employee/GoalRegister'
import SelfEval from './employee/SelfEval'
import MyResult from './employee/MyResult'
import AppealRequest from './employee/AppealRequest'
import GoalApprove from './manager/GoalApprove'
import AchievementReview from './manager/AchievementReview'
import TeamEval from './manager/TeamEval'
import TeamEvalResult from './manager/TeamEvalResult'
import StageGate from '../../components/eval/StageGate'
import {
  ActiveStagesProvider,
  useActiveStages,
  type StageKey,
} from '../../hooks/useActiveStages'
import { useAuth } from '../../contexts/AuthContext'

interface MenuChild {
  label: string
  path: string
  badge?: string
  gate?: StageKey
}

interface MenuItem {
  label: string
  path: string
  children?: MenuChild[]
  gate?: StageKey  // 단계 게이트 적용 — 이 단계가 IN_PROGRESS 일 때만 클릭 가능
}

// 사이드바 섹션 — 역할별 표시/숨김 정책
// - 개인: 모든 로그인 사용자 (피평가자)
// - 팀장: evaluatorRoleApi.me().evaluator === true
// - 관리: HR_ADMIN | HR_SUPER_ADMIN
// admin + 평가자 겸직이면 세 섹션 모두 표시됨.

const PERSONAL_ITEMS: MenuItem[] = [
  { label: '목표 등록', path: '/eval/employee/goal', gate: 'GOAL_ENTRY' },
  { label: '자기평가', path: '/eval/employee/self', gate: 'SELF_EVAL' },
  { label: '내 평가결과', path: '/eval/employee/result' },
  // { label: '이의신청', path: '/eval/employee/appeal' },  // 이의신청 기능 임시 숨김
]

const MANAGER_ITEMS: MenuItem[] = [
  { label: '목표 승인', path: '/eval/manager/goal-approve', gate: 'GOAL_ENTRY' },
  { label: '달성도 검토', path: '/eval/manager/achievement', gate: 'SELF_EVAL' },
  { label: '팀원 평가', path: '/eval/manager/eval', gate: 'MANAGER_EVAL' },
  { label: '팀 결과', path: '/eval/manager/team-result' },
]

const ADMIN_ITEMS: MenuItem[] = [
  {
    label: '평가 설계',
    path: '/eval/design',
    children: [
      { label: '평가 시즌', path: '/eval/design/season' },
      { label: '단계 관리', path: '/eval/design/stage' },
      // KPI 지표/옵션 관리, 평가 규칙은 인사통합으로 이동 (HRAdminPage > 성과 관리)
    ],
  },
  {
    label: '등급 산정/보정',
    path: '/eval/grading',
    children: [
      { label: '자동 산정', path: '/eval/grading/auto' },
      { label: '등급 보정', path: '/eval/grading/calibration' },
      { label: '최종 확정(잠금)', path: '/eval/grading/final' },
    ],
  },
  {
    label: '평가 결과 처리',
    path: '/eval/result',
    children: [
      { label: '결과 조회', path: '/eval/result/view' },
      { label: '급여 연동', path: '/eval/result/incentive' },
      // { label: '이의신청 관리', path: '/eval/result/appeal' },  // 이의신청 기능 임시 숨김
    ],
  },
]

function MenuSection({
  title, items, currentPath, onNavigate,
}: {
  title: string
  items: MenuItem[]
  currentPath: string
  onNavigate: (path: string) => void
}) {
  const { isOpen, loading } = useActiveStages()

  return (
    <div>
      <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase">{title}</div>
      {items.map(item => {
        const hasChildren = item.children && item.children.length > 0
        const isActive = !hasChildren && currentPath === item.path
        const isParentActive = hasChildren && currentPath.startsWith(item.path)
        // 단계 게이트 적용된 항목은 해당 단계가 IN_PROGRESS 가 아니면 disabled
        const isGated = !!item.gate && !loading && !isOpen(item.gate)

        return (
          <div key={item.path}>
            <div
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] flex items-center justify-between gap-1 ${
                isGated
                  ? 'text-gray-300 cursor-not-allowed'
                  : isActive
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE] cursor-pointer'
                  : isParentActive
                  ? 'text-[#1D9E75] font-semibold'
                  : hasChildren
                  ? 'text-[#5a6b62] font-semibold'
                  : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75] cursor-pointer'
              }`}
              onClick={() => {
                if (hasChildren) return
                if (isGated) return
                onNavigate(item.path)
              }}
              title={isGated ? `${item.label} 단계가 아직 열리지 않았습니다` : undefined}
            >
              <span>{item.label}</span>
              {isGated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">
                  대기
                </span>
              )}
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
  const { isHRAdmin, isEvaluator } = useAuth()

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">성과 관리</h2>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto">
          <MenuSection title="개인" items={PERSONAL_ITEMS} currentPath={currentPath} onNavigate={navigate} />
          {isEvaluator && (
            <MenuSection title="팀장" items={MANAGER_ITEMS} currentPath={currentPath} onNavigate={navigate} />
          )}
          {isHRAdmin && (
            <MenuSection title="관리" items={ADMIN_ITEMS} currentPath={currentPath} onNavigate={navigate} />
          )}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <Routes>
        <Route path="employee/goal" element={<StageGate requires="GOAL_ENTRY"><GoalRegister /></StageGate>} />
        <Route path="employee/self" element={<StageGate requires="SELF_EVAL"><SelfEval /></StageGate>} />
        <Route path="employee/result" element={<MyResult />} />
        <Route path="employee/appeal" element={<AppealRequest />} />
        <Route path="manager/goal-approve" element={<StageGate requires="GOAL_ENTRY"><GoalApprove /></StageGate>} />
        <Route path="manager/achievement" element={<StageGate requires="SELF_EVAL"><AchievementReview /></StageGate>} />
        <Route path="manager/eval" element={<StageGate requires="MANAGER_EVAL"><TeamEval /></StageGate>} />
        <Route path="manager/team-result" element={<TeamEvalResult />} />
        <Route path="design/*" element={<EvalDesign />} />
        <Route path="grading/*" element={<EvalGrading />} />
        <Route path="result/*" element={<EvalResult />} />
        <Route path="*" element={<StageGate requires="GOAL_ENTRY"><GoalRegister /></StageGate>} />
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
