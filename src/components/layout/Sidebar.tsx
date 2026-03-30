import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  isHRAdmin: boolean
  menuVisibility: Record<string, boolean>
  onOpenMenuSettings: () => void
}

interface SubMenuItem {
  label: string
  path?: string
}

function NavGroup({ label, items, visible, currentPath, onNavigate }: {
  label: string
  items: SubMenuItem[]
  visible: boolean
  currentPath: string
  onNavigate: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (!visible) return null

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e] transition-colors select-none"
      >
        <span>{label}</span>
        <i className={`fas fa-chevron-down text-[10px] text-[#d0d8d4] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      <div
        className="overflow-hidden transition-all duration-250"
        style={{ maxHeight: open ? `${items.length * 36}px` : '0px' }}
      >
        {items.map((item) => {
          const isActive = item.path ? currentPath === item.path : false
          return (
            <div
              key={item.label}
              onClick={() => item.path && onNavigate(item.path)}
              className={`flex items-center gap-2 py-[7px] px-3 ml-2 mr-2 rounded-md text-[12px] cursor-pointer transition-colors ${
                isActive
                  ? 'text-[#2e9e6e] font-medium'
                  : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
              }`}
            >
              <span className={`w-[5px] h-[5px] rounded-full ${isActive ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`}></span>
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
  const isActive = path ? currentPath === path : false
  return (
    <div
      onClick={() => path && onNavigate(path)}
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
        isActive
          ? 'bg-[#eaf6f0] text-[#2e9e6e] font-medium'
          : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
      }`}
    >
      {label}
    </div>
  )
}

export default function Sidebar({ menuVisibility, onOpenMenuSettings }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <aside className="w-[196px] bg-white border-r border-[#eef0ef] flex flex-col h-full shrink-0">
      {/* 메뉴 */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        <NavItem label="대시보드" visible path="/" currentPath={currentPath} onNavigate={navigate} />

        <NavGroup
          label="게시판"
          visible={menuVisibility.board}
          currentPath={currentPath}
          onNavigate={navigate}
          items={[
            { label: '전사 공지' },
            { label: '부서 게시판' },
            { label: '자유 게시판' },
          ]}
        />

        <NavGroup
          label="전자결재"
          visible={menuVisibility.approval}
          currentPath={currentPath}
          onNavigate={navigate}
          items={[
            { label: '결재 요청' },
            { label: '대기 문서함' },
            { label: '완료 문서함' },
          ]}
        />

        <NavItem label="캘린더" visible path="/calendar" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="파일함" visible currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="근태 / 연차" visible currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="급여" visible path="/salary" currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="성과 평가" visible currentPath={currentPath} onNavigate={navigate} />
        <NavItem label="사원 관리" visible currentPath={currentPath} onNavigate={navigate} />
      </nav>

      {/* 하단 */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[#eef0ef] space-y-2">
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
        <div
          onClick={() => navigate('/org')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg cursor-pointer text-[12px] transition-colors ${
            currentPath === '/org'
              ? 'bg-[#eaf6f0] text-[#2e9e6e] font-medium'
              : 'text-[#8a9490] hover:bg-[#f2faf6] hover:text-[#2e9e6e]'
          }`}
        >
          <i className="fas fa-sitemap text-[11px]" />
          <span>조직도</span>
        </div>
      </div>
    </aside>
  )
}
