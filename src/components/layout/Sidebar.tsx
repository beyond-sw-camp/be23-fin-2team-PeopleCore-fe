import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  isHRAdmin: boolean
  menuVisibility: Record<string, boolean>
  onOpenMenuSettings: () => void
}

interface SubMenuItem {
  label: string
  active?: boolean
}

function NavGroup({ label, items, visible }: { label: string; items: SubMenuItem[]; visible: boolean }) {
  const [open, setOpen] = useState(false)
  if (!visible) return null

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] text-[#8a9490] hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors select-none"
      >
        <span>{label}</span>
        <span className={`text-[11px] text-[#d0d8d4] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </div>
      <div
        className="overflow-hidden transition-all duration-250"
        style={{ maxHeight: open ? `${items.length * 36}px` : '0px' }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 py-[7px] px-3 ml-2 mr-2 rounded-md text-[12px] cursor-pointer transition-colors ${
              item.active
                ? 'text-[#1D9E75] font-medium'
                : 'text-[#8a9490] hover:bg-[#E1F5EE] hover:text-[#1D9E75]'
            }`}
          >
            <span className={`w-[5px] h-[5px] rounded-full ${item.active ? 'bg-[#1D9E75]' : 'bg-[#d0d8d4]'}`}></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NavItem({ label, active, visible, onClick }: { label: string; active?: boolean; visible: boolean; onClick?: () => void }) {
  if (!visible) return null
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors select-none ${
        active
          ? 'bg-[#E1F5EE] text-[#1D9E75] font-medium'
          : 'text-[#8a9490] hover:bg-[#E1F5EE] hover:text-[#1D9E75]'
      }`}
    >
      {label}
    </div>
  )
}

export default function Sidebar({ isHRAdmin, menuVisibility, onOpenMenuSettings }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="w-[196px] bg-white border-r border-[#d1d5db] flex flex-col h-full shrink-0">
      {/* 로고 */}
      <div className="px-5 pt-[18px] pb-4 border-b border-[#d1d5db]">
        <div className="text-[20px] font-bold text-[#1D9E75] tracking-tight">PeopleCore</div>
        <div className="text-[9px] text-[#b0b8b4] tracking-widest uppercase mt-0.5">HR Platform</div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        <NavItem label="대시보드" active={location.pathname === '/'} visible onClick={() => navigate('/')} />

        <NavGroup
          label="게시판"
          visible={menuVisibility.board}
          items={[
            { label: '전사 공지', active: true },
            { label: '부서 게시판' },
            { label: '자유 게시판' },
          ]}
        />

        <NavItem label="전자결재" active={location.pathname === '/approval'} visible={menuVisibility.approval} onClick={() => navigate('/approval')} />

        <NavItem label="캘린더" visible />
        <NavItem label="마이페이지" visible />
        <NavItem label="파일함" visible />
        <NavItem label="AI 챗봇" visible />

        <NavGroup
          label="인사관리"
          visible={isHRAdmin}
          items={[
            { label: '사원 관리' },
            { label: '조직도' },
            { label: '근태 / 연차' },
            { label: '급여' },
            { label: '성과 평가' },
          ]}
        />
      </nav>

      {/* 하단 */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[#d1d5db]">
        <div className="bg-[#E1F5EE] rounded-[9px] p-3.5">
          <div className="text-[12px] font-semibold text-[#1D9E75] mb-1">메뉴 설정</div>
          <div className="text-[11px] text-[#1D9E75] mb-2.5 leading-relaxed">사이드바 메뉴를 커스텀할 수 있습니다.</div>
          <button
            onClick={onOpenMenuSettings}
            className="w-full bg-[#1D9E75] text-white border-none rounded-md py-[7px] text-[12px] font-medium cursor-pointer hover:bg-[#1D9E75] transition-colors"
          >
            설정 열기
          </button>
        </div>
      </div>
    </aside>
  )
}
