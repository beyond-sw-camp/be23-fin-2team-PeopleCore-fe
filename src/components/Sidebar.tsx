import { useRef } from 'react'

interface SidebarProps {
  isHRAdmin: boolean
  menuVisibility: Record<string, boolean>
  onOpenMenuSettings: () => void
}

export default function Sidebar({ isHRAdmin, menuVisibility, onOpenMenuSettings }: SidebarProps) {
  const boardMenuRef = useRef<HTMLDivElement>(null)
  const approvalMenuRef = useRef<HTMLDivElement>(null)

  const toggleSubmenu = (ref: React.RefObject<HTMLDivElement | null>) => {
    const menu = ref.current
    if (!menu) return
    menu.classList.toggle('open')
    const icon = menu.previousElementSibling?.querySelector('.fa-chevron-down') as HTMLElement
    if (icon) {
      icon.style.transform = menu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)'
    }
  }

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <a href="#" className="sidebar-item active-nav flex items-center px-3 py-2 rounded-lg transition-all text-sm font-medium">
          대시보드
        </a>

        {menuVisibility.board && (
          <div>
            <button
              onClick={() => toggleSubmenu(boardMenuRef)}
              className="sidebar-item w-full flex items-center justify-between px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium"
            >
              <span>게시판</span>
              <i className="fas fa-chevron-down text-[10px] text-gray-400 transition-transform"></i>
            </button>
            <div ref={boardMenuRef} className="submenu">
              <div className="ml-4 my-1 border-l-2 border-[#9FE1CB] pl-3 space-y-0.5">
                <a href="#" className="block py-1.5 px-2 text-xs text-gray-500 hover:text-[#1D9E75] hover:bg-[#f0f9f6] rounded transition-all">전사 게시판</a>
                <a href="#" className="block py-1.5 px-2 text-xs text-gray-500 hover:text-[#1D9E75] hover:bg-[#f0f9f6] rounded transition-all">부서 게시판</a>
                <a href="#" className="block py-1.5 px-2 text-xs text-gray-500 hover:text-[#1D9E75] hover:bg-[#f0f9f6] rounded transition-all">자유 게시판</a>
              </div>
            </div>
          </div>
        )}

        {menuVisibility.approval && (
          <div>
            <button
              onClick={() => toggleSubmenu(approvalMenuRef)}
              className="sidebar-item w-full flex items-center justify-between px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium"
            >
              <span>전자결재</span>
              <i className="fas fa-chevron-down text-[10px] text-gray-400 transition-transform"></i>
            </button>
            <div ref={approvalMenuRef} className="submenu">
              <div className="ml-4 my-1 border-l-2 border-[#9FE1CB] pl-3 space-y-0.5">
                <a href="#" className="block py-1.5 px-2 text-xs text-gray-500 hover:text-[#1D9E75] hover:bg-[#f0f9f6] rounded transition-all">결재 요청</a>
                <a href="#" className="block py-1.5 px-2 text-xs text-gray-500 hover:text-[#1D9E75] hover:bg-[#f0f9f6] rounded transition-all">결재 대기</a>
                <a href="#" className="block py-1.5 px-2 text-xs text-gray-500 hover:text-[#1D9E75] hover:bg-[#f0f9f6] rounded transition-all">결재 완료</a>
              </div>
            </div>
          </div>
        )}

        {menuVisibility.attendance && (
          <a href="#" className="sidebar-item flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium">
            근태
          </a>
        )}

        {menuVisibility.performance && (
          <a href="#" className="sidebar-item flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium">
            성과
          </a>
        )}

        {menuVisibility.salary && (
          <a href="#" className="sidebar-item flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium">
            급여
          </a>
        )}

        {menuVisibility.mail && (
          <a href="#" className="sidebar-item flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium">
            메일
          </a>
        )}
      </nav>

      <div className="border-t border-gray-200 px-2 py-2 space-y-1 shrink-0">
        <button
          onClick={onOpenMenuSettings}
          className="sidebar-item w-full flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium"
        >
          메뉴 설정
        </button>
        {isHRAdmin && (
          <a href="#" className="sidebar-item flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium">
            통합 설정
          </a>
        )}
        {menuVisibility.org && (
          <a href="#" className="sidebar-item flex items-center px-3 py-2 text-gray-900 rounded-lg transition-all text-sm font-medium">
            조직도
          </a>
        )}
      </div>
    </aside>
  )
}
