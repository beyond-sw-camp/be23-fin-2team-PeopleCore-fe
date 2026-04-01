import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

interface SidebarProps {
  isHRAdmin: boolean
  isHRSuperAdmin?: boolean
  menuVisibility: Record<string, boolean>
  onOpenMenuSettings: () => void
  onOpenOrgChart: () => void
  onOpenHRAdmin?: () => void
}

interface SubMenuItem {
  label: string
  path: string
}

function NavGroup({ label, items, visible, currentPath, onNavigate }: {
  label: string
  items: SubMenuItem[]
  visible: boolean
  currentPath: string
  onNavigate: (path: string) => void
}) {
  const hasActiveChild = items.some(item => currentPath === item.path || currentPath.startsWith(item.path + '/'))
  const [open, setOpen] = useState(hasActiveChild)
  if (!visible) return null

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
          hasActiveChild ? 'text-[#1D9E75] font-medium' : 'text-[#000000] hover:bg-[#E1F5EE] hover:text-[#1D9E75]'
        }`}
      >
        <span>{label}</span>
        <i className={`fas fa-chevron-down text-[10px] text-[#d0d8d4] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      <div
        className="overflow-hidden transition-all duration-250"
        style={{ maxHeight: open ? `${items.length * 36}px` : '0px' }}
      >
        {items.map(item => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
          return (
            <div
              key={item.label}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-2 py-[7px] px-3 ml-2 mr-2 rounded-md text-[12px] cursor-pointer transition-colors ${
                isActive
                  ? 'text-[#1D9E75] font-medium'
                  : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]'
              }`}
            >
              <span className={`w-[5px] h-[5px] rounded-full ${isActive ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NavItem({ label, visible, path, currentPath, onNavigate }: {
  label: string
  visible: boolean
  path?: string
  currentPath: string
  onNavigate: (path: string) => void
}) {
  if (!visible) return null
  const isActive = path ? (currentPath === path || (path !== '/' && currentPath.startsWith(path))) : false
  return (
    <div
      onClick={() => path && onNavigate(path)}
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
        isActive
          ? 'bg-[#eaf6f0] text-[#1D9E75] font-medium'
          : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]'
      }`}
    >
      {label}
    </div>
  )
}

export default function Sidebar({ isHRAdmin, isHRSuperAdmin, menuVisibility, onOpenMenuSettings, onOpenOrgChart, onOpenHRAdmin }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <aside className="w-[196px] bg-white border-r border-[#d1d5db] flex flex-col h-full shrink-0">
      {/* 메뉴 */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        <NavItem label="대시보드" visible path="/" currentPath={currentPath} onNavigate={navigate} />

        <NavItem label="게시판" visible={menuVisibility.board} path="/board" currentPath={currentPath} onNavigate={navigate} />

        <NavItem label="전자결재" visible={menuVisibility.approval} path="/approval" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="캘린더" visible path="/calendar" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="파일함" visible path="/drive" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="근태 / 연차" visible={menuVisibility.attendance} path="/attendance" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="급여" visible path="/salary" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="제증명 신청" visible path="/certificate" currentPath={currentPath} onNavigate={navigate} />
        <NavGroup
          label="성과관리(개인)"
          visible
          currentPath={currentPath}
          onNavigate={navigate}
          items={[
            { label: '목표 등록', path: '/eval/employee/goal' },
            { label: '자기평가', path: '/eval/employee/self' },
            { label: '동료평가', path: '/eval/employee/peer' },
            { label: '내 평가결과', path: '/eval/employee/result' },
            { label: '이의신청', path: '/eval/employee/appeal' },
          ]}
        />
        <NavGroup
          label="성과관리(팀장)"
          visible
          currentPath={currentPath}
          onNavigate={navigate}
          items={[
            { label: '팀 현황', path: '/eval/manager/status' },
            { label: '목표 승인', path: '/eval/manager/goal-approve' },
            { label: '달성도 검토', path: '/eval/manager/achievement' },
            { label: '팀원 평가', path: '/eval/manager/eval' },
          ]}
        />
        <NavGroup
          label="성과관리"
          visible={isHRAdmin}
          currentPath={currentPath}
          onNavigate={navigate}
          items={[
            { label: '평가 설계', path: '/eval/design' },
            { label: '평가 운영', path: '/eval/operation' },
            { label: '평가 조회', path: '/eval/view' },
            { label: '등급 산정/보정', path: '/eval/grading' },
            { label: '평가 결과 처리', path: '/eval/result' },
          ]}
        />

        {isHRAdmin && (
          <NavItem label="조직 관리" visible path="/org-management" currentPath={currentPath} onNavigate={navigate} />
        )}

        <NavGroup
          label="사원 관리"
          visible={isHRAdmin}
          currentPath={currentPath}
          onNavigate={navigate}
          items={[
            { label: '사원 목록', path: '/hr/list' },
            { label: '사원 등록', path: '/hr/register' },
            { label: '연봉 계약', path: '/hr/salary-contract' },
            { label: '증명서', path: '/hr/certificate' },
            { label: '인력 현황', path: '/hr/workforce' },
            { label: '퇴직 관리', path: '/hr/retirement' },
            { label: '인사 발령', path: '/hr/appointment' },
            { label: '권한 관리', path: '/hr/permission' },
          ]}
        />

        <NavItem label="급여 관리" visible={isHRAdmin} path="/payroll" currentPath={currentPath} onNavigate={navigate} />
      </nav>

      {/* 하단 */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[#eef0ef] space-y-2">
        {/* 인사통합 버튼 - 최고권한자만 표시 */}
        {isHRSuperAdmin && (
          <button
            type="button"
            onClick={onOpenHRAdmin}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg cursor-pointer text-[12px] font-semibold transition-colors bg-[#1D9E75] text-white hover:bg-[#178a65] shadow-sm"
          >
            <i className="fa-solid fa-shield-halved text-[11px]" />
            인사통합
          </button>
        )}
        <button
          type="button"
          onClick={onOpenMenuSettings}
          className="w-full flex items-center justify-start px-3.5 py-2 rounded-lg cursor-pointer text-[12px] transition-colors text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]"
        >
          설정 열기
        </button>
        <div
          onClick={onOpenOrgChart}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg cursor-pointer text-[12px] transition-colors text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]"
        >
          <span>조직도</span>
        </div>
      </div>
    </aside>
  )
}
