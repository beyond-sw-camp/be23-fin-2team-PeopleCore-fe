import { useNavigate, useLocation } from 'react-router-dom'

export type MenuKey =
  | 'dashboard'
  | 'approval'
  | 'calendar'
  | 'drive'
  | 'attendance'
  | 'salary'
  | 'performance'
  | 'hr'
  | 'payroll'
  | 'eval-admin'

export interface MenuItemConfig {
  key: MenuKey
  label: string
  path: string
  togglable: boolean
  lockedOrder: boolean
  requireHRAdmin?: boolean
}

export const SIDEBAR_MENU_ITEMS: MenuItemConfig[] = [
  { key: 'dashboard', label: '대시보드', path: '/', togglable: false, lockedOrder: true },
  { key: 'approval', label: '전자결재', path: '/approval', togglable: true, lockedOrder: false },
  { key: 'calendar', label: '캘린더', path: '/calendar', togglable: false, lockedOrder: false },
  { key: 'drive', label: '파일함', path: '/drive', togglable: false, lockedOrder: false },
  { key: 'attendance', label: '근태 / 연차', path: '/attendance', togglable: true, lockedOrder: false },
  { key: 'salary', label: '급여', path: '/salary', togglable: false, lockedOrder: false },
  { key: 'performance', label: '성과평가', path: '/eval', togglable: false, lockedOrder: false },
  { key: 'hr', label: '사원 관리', path: '/hr', togglable: false, lockedOrder: false, requireHRAdmin: true },
  { key: 'payroll', label: '급여 관리', path: '/payroll', togglable: false, lockedOrder: false, requireHRAdmin: true },
  { key: 'eval-admin', label: '평가 관리', path: '/eval-admin', togglable: true, lockedOrder: false, requireHRAdmin: true },
]

export const DEFAULT_MENU_ORDER: MenuKey[] = SIDEBAR_MENU_ITEMS.map((i) => i.key)

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
}

function NavItem({ label, visible, path, currentPath, onNavigate }: {
  label: string
  visible: boolean
  path?: string
  currentPath: string
  onNavigate: (path: string) => void
}) {
  if (!visible) return null
  const isActive = path ? (currentPath === path || (path !== '/' && currentPath.startsWith(path + '/'))) : false
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
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

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

  return (
    <aside className="w-[196px] bg-white border-r border-[#d1d5db] flex flex-col h-full shrink-0">
      {/* 메뉴 */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        {orderedItems.map((item) => {
          if (item.requireHRAdmin && !isHRAdmin) return null
          const visible = serverControlled
            ? (menuVisibility[item.key] ?? true)
            : item.togglable
              ? (menuVisibility[item.key] ?? true)
              : true
          return (
            <NavItem
              key={item.key}
              label={item.label}
              visible={visible}
              path={item.path}
              currentPath={currentPath}
              onNavigate={navigate}
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
