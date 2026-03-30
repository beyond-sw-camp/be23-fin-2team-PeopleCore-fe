import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  isHRAdmin: boolean
  menuVisibility: Record<string, boolean>
  onOpenMenuSettings: () => void
}

interface MenuItem {
  label: string
  to?: string
}

interface SubGroup {
  label: string
  items: MenuItem[]
}

interface MiddleGroup {
  label: string
  subGroups: SubGroup[]
}

/* 단일 메뉴 아이템 (링크) */
function NavItem({ label, visible, to }: { label: string; visible: boolean; to?: string }) {
  const location = useLocation()
  if (!visible) return null
  const isActive = to ? location.pathname === to : false

  const content = (
    <div
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
        isActive
          ? 'bg-[#eaf6f0] text-[#2e9e6e] font-medium'
          : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
      }`}
    >
      {label}
    </div>
  )

  return to ? <Link to={to} className="no-underline">{content}</Link> : content
}

/* 1단계 펼침 그룹 (직접 아이템만) */
function NavGroup({ label, items, visible }: { label: string; items: MenuItem[]; visible: boolean }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const hasActiveChild = items.some(item => item.to && location.pathname.startsWith(item.to))

  if (!visible) return null

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
          hasActiveChild ? 'text-[#2e9e6e] font-medium' : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
        }`}
      >
        <span>{label}</span>
        <span className={`text-[11px] text-[#d0d8d4] transition-transform duration-200 ${open || hasActiveChild ? 'rotate-180' : ''}`}>▾</span>
      </div>
      {(open || hasActiveChild) && (
        <div>
          {items.map(item => {
            const isActive = item.to ? location.pathname === item.to || location.pathname.startsWith(item.to + '/') : false
            const content = (
              <div className={`flex items-center gap-2 py-[7px] px-3 ml-2 mr-2 rounded-md text-[12px] cursor-pointer transition-colors ${
                isActive ? 'text-[#2e9e6e] font-medium' : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
              }`}>
                <span className={`w-[5px] h-[5px] rounded-full ${isActive ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`} />
                <span>{item.label}</span>
              </div>
            )
            return item.to ? (
              <Link key={item.label} to={item.to} className="no-underline">{content}</Link>
            ) : (
              <div key={item.label}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* 2단계 펼침 그룹 (아이템 + 하위 서브그룹 + 중간 묶음 지원) */
function NavGroupNested({ label, items, subGroups, middleGroups, visible }: {
  label: string
  items?: MenuItem[]
  subGroups?: SubGroup[]
  middleGroups?: MiddleGroup[]
  visible: boolean
}) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const allItems = items || []
  const allSubs = subGroups || []
  const allMiddles = middleGroups || []

  const hasActiveChild =
    allItems.some(item => item.to && location.pathname.startsWith(item.to)) ||
    allSubs.some(sg => sg.items.some(item => item.to && location.pathname.startsWith(item.to))) ||
    allMiddles.some(mg => mg.subGroups.some(sg => sg.items.some(item => item.to && location.pathname.startsWith(item.to))))

  if (!visible) return null

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
          hasActiveChild ? 'text-[#2e9e6e] font-medium' : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
        }`}
      >
        <span>{label}</span>
        <span className={`text-[11px] text-[#d0d8d4] transition-transform duration-200 ${open || hasActiveChild ? 'rotate-180' : ''}`}>▾</span>
      </div>

      {(open || hasActiveChild) && (
        <div className="ml-1">
          {/* 직접 아이템 */}
          {allItems.map(item => {
            const isActive = item.to ? location.pathname === item.to || location.pathname.startsWith(item.to + '/') : false
            const content = (
              <div className={`flex items-center gap-2 py-[7px] px-3 ml-2 mr-2 rounded-md text-[12px] cursor-pointer transition-colors ${
                isActive ? 'text-[#2e9e6e] font-medium' : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
              }`}>
                <span className={`w-[5px] h-[5px] rounded-full ${isActive ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`} />
                <span>{item.label}</span>
              </div>
            )
            return item.to ? (
              <Link key={item.label} to={item.to} className="no-underline">{content}</Link>
            ) : (
              <div key={item.label}>{content}</div>
            )
          })}

          {/* 직접 서브그룹 */}
          {allSubs.map(sg => (
            <SubGroupSection key={sg.label} label={sg.label} items={sg.items} />
          ))}

          {/* 중간 묶음 그룹 (클릭하면 안에 서브그룹들이 펼쳐짐) */}
          {allMiddles.map(mg => (
            <MiddleGroupSection key={mg.label} label={mg.label} subGroups={mg.subGroups} />
          ))}
        </div>
      )}
    </div>
  )
}

/* 중간 묶음 (인사관리 > 성과관리 같은 중간 레벨) */
function MiddleGroupSection({ label, subGroups }: { label: string; subGroups: SubGroup[] }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const hasActiveChild = subGroups.some(sg => sg.items.some(item => item.to && location.pathname.startsWith(item.to)))

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between py-[7px] px-3 ml-2 mr-2 rounded-md cursor-pointer text-[12px] transition-colors select-none ${
          hasActiveChild ? 'text-[#2e9e6e] font-medium' : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-[5px] h-[5px] rounded-full ${hasActiveChild ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`} />
          <span>{label}</span>
        </div>
        <span className={`text-[9px] text-[#d0d8d4] transition-transform duration-200 ${open || hasActiveChild ? 'rotate-180' : ''}`}>▾</span>
      </div>
      {(open || hasActiveChild) && (
        <div className="ml-2">
          {subGroups.map(sg => (
            <SubGroupSection key={sg.label} label={sg.label} items={sg.items} />
          ))}
        </div>
      )}
    </div>
  )
}

/* 서브그룹 (2단계 내부에서 펼쳐지는 그룹) */
function SubGroupSection({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const hasActiveChild = items.some(item => item.to && location.pathname.startsWith(item.to))

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between py-[6px] px-3 ml-2 mr-2 rounded-md cursor-pointer text-[11px] transition-colors select-none ${
          hasActiveChild ? 'text-[#2e9e6e] font-medium' : 'text-[#a0aaa5] hover:text-[#2e9e6e]'
        }`}
      >
        <span>{label}</span>
        <span className={`text-[9px] text-[#d0d8d4] transition-transform duration-200 ${open || hasActiveChild ? 'rotate-180' : ''}`}>▾</span>
      </div>
      {(open || hasActiveChild) && (
        <div>
          {items.map(item => {
            const isActive = item.to ? location.pathname === item.to || location.pathname.startsWith(item.to + '/') : false
            const content = (
              <div className={`flex items-center gap-2 py-[5px] px-3 ml-4 mr-2 rounded-md text-[11px] cursor-pointer transition-colors ${
                isActive ? 'text-[#2e9e6e] font-medium' : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
              }`}>
                <span className={`w-[4px] h-[4px] rounded-full ${isActive ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`} />
                <span>{item.label}</span>
              </div>
            )
            return item.to ? (
              <Link key={item.label} to={item.to} className="no-underline">{content}</Link>
            ) : (
              <div key={item.label}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ isHRAdmin, menuVisibility, onOpenMenuSettings }: SidebarProps) {
  return (
    <aside className="w-[196px] bg-white border-r border-[#eef0ef] flex flex-col h-full shrink-0">
      {/* 로고 */}
      <div className="px-5 pt-[18px] pb-4 border-b border-[#eef0ef]">
        <div className="text-[20px] font-bold text-[#2e9e6e] tracking-tight">PeopleCore</div>
        <div className="text-[9px] text-[#b0b8b4] tracking-widest uppercase mt-0.5">HR Platform</div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        <NavItem label="대시보드" visible to="/" />

        <NavGroup
          label="게시판"
          visible={menuVisibility.board}
          items={[
            { label: '전사 공지' },
            { label: '부서 게시판' },
            { label: '자유 게시판' },
          ]}
        />

        <NavGroup
          label="전자결재"
          visible={menuVisibility.approval}
          items={[
            { label: '결재 요청' },
            { label: '대기 문서함' },
            { label: '완료 문서함' },
          ]}
        />

        <NavItem label="캘린더" visible />
        <NavItem label="마이페이지" visible />
        <NavItem label="파일함" visible />
        <NavItem label="AI 챗봇" visible />

        {/* 인사관리 (HR Admin) - 기존 인사 + 성과관리(인사) 통합 */}
        <NavGroupNested
          label="인사관리"
          visible={isHRAdmin}
          items={[
            { label: '사원 관리', to: '/hr/employee' },
            { label: '권한 관리', to: '/hr/permission' },
            { label: '인사 발령', to: '/hr/appointment' },
            { label: '퇴직 관리', to: '/hr/retirement' },
            { label: '연봉 계약', to: '/hr/salary-contract' },
            { label: '제증명', to: '/hr/certificate' },
            { label: '인력 현황', to: '/hr/workforce' },
          ]}
          middleGroups={[
            {
              label: '성과관리',
              subGroups: [
                {
                  label: '설계',
                  items: [
                    { label: '평가 주기/일정 생성', to: '/eval/design/season-create' },
                    { label: '평가 항목·가중치', to: '/eval/design/item-weight' },
                    { label: '평가 대상자 확정', to: '/eval/design/target-confirm' },
                    { label: '강제배분 설정', to: '/eval/design/force-distribution' },
                    { label: '동료평가 지정', to: '/eval/design/peer-assignment' },
                  ],
                },
                {
                  label: '운영',
                  items: [
                    { label: '평가 일정 공지', to: '/eval/operation/schedule-notice' },
                    { label: '평가 오픈/마감', to: '/eval/operation/stage-open-close' },
                    { label: '목표 등록 현황', to: '/eval/operation/goal-status' },
                    { label: '평가 입력 모니터링', to: '/eval/operation/input-monitor' },
                    { label: '미제출 독촉 알림', to: '/eval/operation/overdue-reminder' },
                  ],
                },
                {
                  label: '조회',
                  items: [
                    { label: '전체 평가 조회', to: '/eval/view/all' },
                    { label: '본인 평가 조회', to: '/eval/view/my' },
                    { label: '팀장 평가 조회', to: '/eval/view/manager' },
                    { label: '동료 평가 조회', to: '/eval/view/peer' },
                  ],
                },
                {
                  label: '등급',
                  items: [
                    { label: '등급 초안 자동 산정', to: '/eval/grading/grade-draft' },
                    { label: '부서별 등급 분포', to: '/eval/grading/dept-distribution' },
                    { label: '등급 보정 (Calibration)', to: '/eval/grading/calibration' },
                    { label: '최종 등급 확정·잠금', to: '/eval/grading/final-lock' },
                  ],
                },
                {
                  label: '결과',
                  items: [
                    { label: '평가 결과 조회', to: '/eval/result/result-view' },
                    { label: '급여/인센티브 연동', to: '/eval/result/salary-link' },
                    { label: '평가 결과 일괄 통보', to: '/eval/result/bulk-notify' },
                    { label: '이의신청 관리', to: '/eval/result/appeal' },
                    { label: '평가 리포트 출력', to: '/eval/result/report' },
                    { label: '연도별 이력 관리', to: '/eval/result/history' },
                  ],
                },
              ],
            },
          ]}
        />

        {/* 성과관리 (전체 사용자) - 개인 + 팀장 */}
        <NavGroupNested
          label="성과관리"
          visible
          subGroups={[
            {
              label: '개인',
              items: [
                { label: '목표 등록/수정', to: '/eval/employee/goal-register' },
                { label: '자기평가', to: '/eval/employee/self-eval' },
                { label: '동료평가', to: '/eval/employee/peer-eval' },
                { label: '평가결과 조회', to: '/eval/employee/my-result' },
                { label: '이의신청', to: '/eval/employee/appeal' },
              ],
            },
            {
              label: '팀장',
              items: [
                { label: '팀원 목표 승인', to: '/eval/manager/goal-approve' },
                { label: '팀원 달성도 검토', to: '/eval/manager/achievement-review' },
                { label: '팀원 평가/피드백', to: '/eval/manager/team-eval' },
                { label: '팀원 평가 현황', to: '/eval/manager/team-status' },
              ],
            },
          ]}
        />
      </nav>

      {/* 하단 */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[#eef0ef]">
        <div className="bg-[#f2faf6] rounded-[9px] p-3.5">
          <div className="text-[12px] font-semibold text-[#2e9e6e] mb-1">메뉴 설정</div>
          <div className="text-[11px] text-[#5a8a70] mb-2.5 leading-relaxed">사이드바 메뉴를 커스텀할 수 있습니다.</div>
          <button
            onClick={onOpenMenuSettings}
            className="w-full bg-[#2e9e6e] text-white border-none rounded-md py-[7px] text-[12px] font-medium cursor-pointer hover:bg-[#26865d] transition-colors"
          >
            설정 열기
          </button>
        </div>
      </div>
    </aside>
  )
}
