import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  isHRAdmin: boolean
  menuVisibility: Record<string, boolean>
  onOpenMenuSettings: () => void
  onOpenOrgChart: () => void
}

function NavItem({ label, visible, path, currentPath, onNavigate }: {
  label: string
  visible: boolean
  path?: string
  currentPath: string
  onNavigate: (path: string) => void
}) {
  if (!visible) return null
  const isActive = path ? currentPath === path : false
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

export default function Sidebar({ isHRAdmin, menuVisibility, onOpenMenuSettings, onOpenOrgChart }: SidebarProps) {
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
        <NavItem label="근태 / 연차" visible currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="급여" visible path="/salary" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="성과 평가" visible currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="사원 관리" visible={isHRAdmin} currentPath={currentPath} onNavigate={navigate} />
      </nav>

      {/* 하단 */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[#eef0ef] space-y-2">
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