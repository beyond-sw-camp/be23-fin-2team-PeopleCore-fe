import { useNavigate, useLocation } from 'react-router-dom'
import { SIDEBAR_MENU_ITEMS, type MenuItemConfig, type MenuKey } from './sidebarMenu'

interface SidebarProps {
  isHRAdmin: boolean
  isHRSuperAdmin?: boolean
  menuVisibility: Record<string, boolean>
  menuOrder: MenuKey[]
  /** true 면 menuOrder 에 포함된 메뉴만 렌더 (서버 응답 기준). false 면 누락된 메뉴는 뒤에 붙임. */
  serverControlled?: boolean
  onOpenMenuSettings: () => void
  onOpenOrgChart: () => void
  onOpenHRAdmin?: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

function NavItem({ label, visible, path, currentPath, onNavigate, isActive: isActiveOverride }: {
  label: string
  visible: boolean
  path?: string
  currentPath: string
  onNavigate: (path: string) => void
  isActive?: boolean
}) {
  if (!visible) return null
  const isActive = isActiveOverride !== undefined
    ? isActiveOverride
    : path ? (currentPath === path || (path !== '/' && currentPath.startsWith(path + '/'))) : false
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

export default function Sidebar({
  isHRAdmin,
  isHRSuperAdmin,
  menuVisibility,
  menuOrder,
  serverControlled,
  onOpenMenuSettings,
  onOpenOrgChart,
  onOpenHRAdmin,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const currentTab = new URLSearchParams(location.search).get('tab')

  const navigateAndClose = (path: string) => {
    navigate(path)
    onCloseMobile?.()
  }

  const itemMap = new Map(SIDEBAR_MENU_ITEMS.map((i) => [i.key, i] as const))
  const orderedItems: MenuItemConfig[] = []
  menuOrder.forEach((k) => {
    const item = itemMap.get(k)
    if (item) orderedItems.push(item)
  })
  // 관리자 전용 메뉴는 백엔드 menu-settings 에 미등록되어도 항상 노출.
  // (FE 에서 신규 admin 메뉴 추가 시 backend 동시 배포 없이 동작하게 하기 위함)
  SIDEBAR_MENU_ITEMS.forEach((i) => {
    if (menuOrder.includes(i.key)) return
    if (!serverControlled || i.requireHRAdmin) orderedItems.push(i)
  })

  const renderContent = (
    <>
      {/* 메뉴 */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        {orderedItems.map((item) => {
          if (item.requireHRAdmin && !isHRAdmin) return null
          const visible = serverControlled
            ? (menuVisibility[item.key] ?? true)
            : item.togglable
              ? (menuVisibility[item.key] ?? true)
              : true
          // 근태/휴가는 같은 /attendance 라우트를 공유하므로 ?tab 으로 활성 여부 판정
          let isActive: boolean | undefined = undefined
          if (item.key === 'attendance' || item.key === 'leave') {
            const onAttendance = currentPath === '/attendance' || currentPath.startsWith('/attendance/')
            isActive = item.key === 'attendance'
              ? onAttendance && currentTab === 'attendance'
              : onAttendance && currentTab !== 'attendance'
          }
          return (
            <NavItem
              key={item.key}
              label={item.label}
              visible={visible}
              path={item.path}
              currentPath={currentPath}
              onNavigate={navigateAndClose}
              isActive={isActive}
            />
          )
        })}
      </nav>

      {/* 하단 */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[#eef0ef] space-y-2">
        {/* 인사통합 버튼 - 최고권한자만 표시 */}
        {isHRSuperAdmin && (
          <button
            type="button"
            onClick={() => { onOpenHRAdmin?.(); onCloseMobile?.() }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg cursor-pointer text-[12px] font-semibold transition-colors bg-[#1D9E75] text-white hover:bg-[#178a65] shadow-sm"
          >
            <i className="fa-solid fa-shield-halved text-[11px]" />
            인사통합
          </button>
        )}
        <button
          type="button"
          onClick={() => { onOpenMenuSettings(); onCloseMobile?.() }}
          className="w-full flex items-center justify-start px-3.5 py-2 rounded-lg cursor-pointer text-[12px] transition-colors text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]"
        >
          설정 열기
        </button>
        <div
          onClick={() => { onOpenOrgChart(); onCloseMobile?.() }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg cursor-pointer text-[12px] transition-colors text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]"
        >
          <span>조직도</span>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-[196px] bg-white border-r border-[#d1d5db] flex-col h-full shrink-0">
        {renderContent}
      </aside>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="relative bg-white w-[240px] max-w-[80vw] border-r border-[#d1d5db] flex flex-col h-full shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef0ef]">
              <span className="text-[14px] font-semibold text-gray-800">메뉴</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="메뉴 닫기"
              >
                <i className="fa-solid fa-xmark text-[14px]" />
              </button>
            </div>
            {renderContent}
          </aside>
        </div>
      )}
    </>
  )
}
